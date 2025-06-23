import sys
import asyncio

# Set Windows-compatible event loop policy
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from loguru import logger
from src.configuration import config
import pickle
from psycopg_pool import AsyncConnectionPool

pool = AsyncConnectionPool(config.DB_URL, min_size=5, max_size=10, open=False)


class WorkerClient:
    def __init__(self, parser_client, client_type):
        self.parser_client = parser_client
        self.client_type = client_type

    async def create_table_if_not_exists(
        self, schema_name="public", table_name="project"
    ):
        await pool.open()
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(f"""
                    CREATE TABLE IF NOT EXISTS {schema_name}.parser_{table_name} (
                        id SERIAL PRIMARY KEY,
                        file_path TEXT,
                        file_bytes BYTEA,
                        url TEXT,
                        title TEXT,
                        processed BOOLEAN DEFAULT FALSE,
                        parsed_document BYTEA
                    );
                """)
            await conn.commit()
        logger.info(f"Ensured table '{table_name}' exists in the database")

    async def check_project_exists(self, schema_name) -> bool:
        """
        Check if a project table exists in the given schema.
        Returns True if exists, False otherwise.
        """
        await pool.open()
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_schema = %s
                    );
                    """,
                    (schema_name,),
                )
                exists = (await cur.fetchone())[0]
        return exists

    async def insert_into_table(self, schema_name, table_name, insert_object):
        await pool.open()
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                # Check if the table exists before inserting
                await cur.execute(
                    """
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_schema = %s AND table_name = %s
                    );
                    """,
                    (schema_name, f"parser_{table_name}"),
                )
                exists = (await cur.fetchone())[0]
                if not exists:
                    raise Exception(
                        f"Table {schema_name}.parser_{table_name} does not exist"
                    )

                await cur.execute(
                    f"""
                    INSERT INTO {schema_name}.parser_{table_name} (file_path, file_bytes, url, title, processed, parsed_document)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id;
                    """,
                    (
                        insert_object.get("file_path"),
                        insert_object.get("file_bytes"),
                        insert_object.get("url"),
                        insert_object.get("title"),
                        insert_object.get("processed", False),
                        insert_object.get("parsed_document", None),
                    ),
                )
                inserted_id = await cur.fetchone()
                await conn.commit()
        logger.info(
            f"Inserted new row into table 'parser_{table_name}' with id {inserted_id[0] if inserted_id else None}"
        )

    async def fetch_target_tables(self):
        """
        Fetch all target tables from psql.
        This assumes that target tables are named with a prefix 'parse'.
        Returns a list of tuples (schemaname, tablename).
        """
        await pool.open()
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                        SELECT schemaname, tablename FROM pg_tables WHERE tablename ILIKE 'parse%';
                    """)
                target_tables = await cur.fetchall()
        logger.info(f"Found {len(target_tables)} target tables in the database")
        return target_tables

    async def check_new_documents(self, target_tables):
        """
        Check for new documents to process in the target tables.
        Returns a list of new documents to process.
        """
        new_documents = []
        async with pool.connection() as conn:
            for schemaname, tablename in target_tables:
                async with conn.cursor() as cur:
                    await cur.execute(f"""
                    SELECT * FROM {schemaname}.{tablename} WHERE processed = FALSE;
                    """)
                    rows = await cur.fetchall()
                    if rows:
                        column_names = [desc[0] for desc in cur.description]
                        for row in rows:
                            doc = dict(zip(column_names, row))
                            doc_with_table = {
                                **doc,
                                "schemaname": schemaname,
                                "tablename": tablename,
                            }
                            new_documents.append(doc_with_table)
            logger.info(f"Found {len(new_documents)} new documents to process")
        return new_documents

    async def parse_documents(self, documents):
        """
        Parse the documents using the parser client.
        Returns a list of parsed documents and schema/table names.
        """
        logger.info(f"Parsing {len(documents)} documents")
        parsed_documents, schemas_tables = [], []
        for document in documents:
            try:
                file_type = (
                    document.get("file_path").split(".")[-1]
                    if document.get("file_path") and "." in document.get("file_path")
                    else "pdf"
                )
                file_path = f"temp.{file_type}"
                with open(file_path, "wb") as f:
                    f.write(document.get("file_bytes"))
                metadata = {
                    "id": document.get("id", ""),
                    "url": document.get("url", ""),
                    "title": document.get("title", ""),
                }
                parsed_document = await self.parser_client.aprocess_document(
                    file_path, extra_info=metadata
                )
                schemaname = document.get("schemaname")
                tablename = document.get("tablename")
                parsed_documents.append(parsed_document)
                schemas_tables.append((schemaname, tablename))
            except Exception as e:
                logger.error(f"Error parsing document: {e}")
                return [], []
        logger.info(f"Parsed {len(parsed_documents)} documents")
        return parsed_documents, schemas_tables

    async def upload_parsed_documents(self, parsed_documents, schemas_tables):
        """
        Upload the parsed documents to the database.
        This assumes that the parsed documents are in a format that can be directly inserted into the database.
        """
        await pool.open()
        async with pool.connection() as conn:
            async with conn.cursor() as cur:  # TODO:, check for id
                for parsed_document, (schema_name, table_name) in zip(
                    parsed_documents, schemas_tables
                ):
                    try:
                        if not parsed_document:
                            logger.warning(
                                "Empty list passed as parsed_document. Skipping document."
                            )
                            continue
                        # Get doc_id from the parsed_document's metadata (if it's a Document object)
                        if isinstance(parsed_document, list):
                            parsed_document = parsed_document[0]
                        if hasattr(parsed_document, "metadata"):
                            doc_id = parsed_document.metadata.get("id", "")
                        else:
                            doc_id = parsed_document.get("metadata", {}).get("id", "")
                        assert doc_id and doc_id != ""
                        await cur.execute(
                            f"""
                            UPDATE {schema_name}.{table_name}
                            SET processed = TRUE, parsed_document = %s
                            WHERE id = %s;
                        """,
                            (
                                pickle.dumps(parsed_document),
                                doc_id,
                            ),
                        )
                        # Find the pgai_table_name. This assumes they are in the same schema.
                        embedding_store_table = (
                            f"{table_name.split('parser_')[-1]}_embedding_store"
                        )
                        await cur.execute(
                            """
                            SELECT tablename FROM pg_tables
                            WHERE schemaname = %s 
                              AND tablename != %s
                              AND tablename != %s
                            LIMIT 1;
                            """,
                            (schema_name, table_name, embedding_store_table),
                        )
                        result = await cur.fetchone()
                        if result:
                            pgai_table_name = result[0]
                        else:
                            logger.error(
                                f"No suitable non-parser table found in schema {schema_name}"
                            )
                            continue
                        await cur.execute(
                            f"""
                            INSERT INTO {schema_name}.{pgai_table_name} 
                            (text, title, url)
                            VALUES (%s, %s, %s);
                            """,
                            (
                                getattr(parsed_document, "text", None)
                                if hasattr(parsed_document, "text")
                                else parsed_document.get("text", None),
                                getattr(parsed_document, "metadata", {}).get(
                                    "title", None
                                )
                                if hasattr(parsed_document, "metadata")
                                else parsed_document.get("metadata", {}).get(
                                    "title", None
                                ),
                                getattr(parsed_document, "metadata", {}).get(
                                    "url", None
                                )
                                if hasattr(parsed_document, "metadata")
                                else parsed_document.get("metadata", {}).get(
                                    "url", None
                                ),
                            ),
                        )
                        await conn.commit()
                    except Exception as e:
                        logger.error(f"Error uploading parsed document: {e}")
                        return
        logger.info(
            f"Uploaded {len(parsed_documents)} parsed documents to the database"
        )

    async def get_all_projects(self):
        target_tables = await self.fetch_target_tables()
        return [table[0] for table in target_tables]
