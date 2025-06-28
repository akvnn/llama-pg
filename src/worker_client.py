import datetime
import sys
import asyncio
import uuid

from fastapi import HTTPException

from src.models.document import DocumentDetail, DocumentStatus
from src.models.pagination import PaginationResponse
from src.models.system import StatInfo, SystemResponse

# Set Windows-compatible event loop policy
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from loguru import logger
from src.configuration import config
import pickle
from psycopg_pool import AsyncConnectionPool

pool = AsyncConnectionPool(
    config.DB_URL,
    min_size=config.DB_POOL_MIN_SIZE,
    max_size=config.DB_POOL_MIN_SIZE,
    open=False,
    max_idle=config.DB_POOL_IDLE_TIMEOUT,
    max_lifetime=config.DB_POOL_LIFETIME_TIMEOUT,
)


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
                        parsed_document BYTEA,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP,
                        processed_at TIMESTAMP,
                        document_id UUID,
                        status TEXT,
                        summary TEXT
                    );
                """)  # TODO: modify insert to reflect new schema
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
                document_id = uuid.uuid4()
                await cur.execute(
                    f"""
                    INSERT INTO {schema_name}.parser_{table_name} (file_path, file_bytes, url, title, processed, parsed_document, created_at, document_id, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                    """,
                    (
                        insert_object.get("file_path"),
                        insert_object.get("file_bytes"),
                        insert_object.get("url"),
                        insert_object.get("title"),
                        insert_object.get("processed", False),
                        insert_object.get("parsed_document", None),
                        datetime.datetime.now(),
                        document_id,
                        DocumentStatus.PENDING.value,
                    ),
                )
                await conn.commit()
        logger.info(
            f"Inserted new row into table 'parser_{table_name}' with id {document_id if document_id else None}"
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

    async def get_recent_documents_info(
        self, projects: list, skip: int, limit: int
    ) -> PaginationResponse:
        """Assumes the project exists"""
        await pool.open()
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                union_queries = []
                for project in projects:
                    table_name = "wiki"  # TODO: make table name dynamic
                    union_queries.append(f"""
                        SELECT *, '{project}' as project_name 
                        FROM {project}.parser_{table_name}
                    """)
                combined_query = " UNION ALL ".join(union_queries)
                # Get total count
                count_query = f"SELECT COUNT(*) FROM ({combined_query}) as combined"
                await cur.execute(count_query)
                total_count = (await cur.fetchone())[0]
                paginated_query = f"""
                SELECT * FROM ({combined_query}) as combined 
                ORDER BY created_at DESC 
                LIMIT %s OFFSET %s
                """
                await cur.execute(paginated_query, (limit, skip))
                column_names = [desc[0] for desc in cur.description]
                documents = await cur.fetchall()
                documents_info = []
                for document in documents:
                    doc_dict = dict(zip(column_names, document))
                    documents_info.append(
                        {
                            "project_name": doc_dict.get("project_name"),
                            "document_type": doc_dict.get("file_path").split(".")[-1]
                            if "." in doc_dict.get("file_path")
                            else "pdf",
                            "document_status": doc_dict.get(
                                "status"
                            ),  # TODO handle different statuses properly
                            "document_id": doc_dict.get("document_id"),
                            "created_at": doc_dict.get("created_at"),
                            "updated_at": doc_dict.get("updated_at", None),
                        }
                    )

                total_pages = (total_count + limit - 1) // limit  # Ceiling division
                current_page = (skip // limit) + 1
                has_next = skip + limit < total_count
                has_previous = skip > 0
                return PaginationResponse(
                    items=documents_info,
                    total_count=total_count,
                    page=current_page,
                    per_page=limit,
                    total_pages=total_pages,
                    has_next=has_next,
                    has_previous=has_previous,
                )

    async def get_document_by_id(
        self, project_name: str, document_id: uuid.UUID
    ) -> DocumentDetail:
        await pool.open()
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                table_name = "wiki"  # TODO: make table name dynamic
                await cur.execute(
                    f"""
                            SELECT file_path, status, created_at, updated_at, parsed_document, summary FROM {project_name}.parser_{table_name}
                            WHERE document_id = %s;
                            """,
                    (document_id,),
                )
                document = await cur.fetchone()
                if not document:
                    raise HTTPException(status_code=404, detail="Document not found")
                file_path, status, created_at, updated_at, parsed_document, summary = (
                    document
                )
                if parsed_document:
                    parsed_document = pickle.loads(parsed_document)
                    parsed_markdown_text = (
                        getattr(parsed_document, "text", None)
                        if hasattr(parsed_document, "text")
                        else parsed_document.get("text", None)
                    )
                else:
                    parsed_markdown_text = None
                return DocumentDetail(
                    document_name=file_path,
                    document_type=file_path.split(".")[-1]
                    if "." in file_path
                    else "pdf",
                    document_status=status,
                    document_id=document_id,
                    created_at=created_at,
                    updated_at=updated_at,
                    parsed_markdown_text=parsed_markdown_text,
                    summary=summary if summary else "",
                )

    async def get_projects_info(self, projects: list) -> PaginationResponse:
        await pool.open()
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                union_queries = []
                table_name = "wiki"  # TODO: make table name dynamic
                logger.debug(projects)
                for project in projects:
                    union_queries.append(f"""
                    SELECT COUNT(*) as count, '{project}' as project_name 
                    FROM {project}.parser_{table_name}
                """)
                combined_query = " UNION ALL ".join(union_queries)
                await cur.execute(combined_query)
                results = await cur.fetchall()
                logger.debug(results)
                projects_info = []
                for count, project_name in results:
                    projects_info.append(
                        {
                            "project_name": project_name,
                            "number_of_documents": count,
                            "description": "",
                        }  # TODO, add description
                    )
                return PaginationResponse(
                    items=projects_info,
                    total=len(projects_info),
                    page=None,
                    per_page=None,
                    total_pages=1,
                    has_next=False,
                    has_previous=False,
                )

    async def get_stats(self, projects: list) -> StatInfo:
        await pool.open()
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                union_queries = []
                table_name = "wiki"  # TODO: make table name dynamic

                for project in projects:
                    union_queries.append(f"""
                        SELECT status, COUNT(*) as count
                        FROM {project}.parser_{table_name}
                        GROUP BY status
                    """)

                combined_query = " UNION ALL ".join(union_queries)

                final_query = f"""
                    SELECT status, SUM(count) as total_count
                    FROM ({combined_query}) as combined_stats
                    GROUP BY status
                """

                await cur.execute(final_query)
                results = await cur.fetchall()

                status_counts = {}
                total_count = 0
                for status, count in results:
                    status_counts[status] = count
                    total_count += count

                return StatInfo(
                    total_count=total_count,
                    projects_count=len(projects),
                    status_counts=status_counts,
                )

    async def get_errors(self) -> SystemResponse:
        await pool.open()
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """
                            SELECT message, details, recorded FROM ai._vectorizer_errors;
                            """,
                )
                errors = await cur.fetchall()
                error_items = []
                for message, details, recorded in errors:
                    error_items.append(
                        {
                            "message": message,
                            "details": details,
                            "recorded_at": recorded,
                        }
                    )
                return SystemResponse(items=error_items)
