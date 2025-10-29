import json
import sys
import asyncio

from fastapi import HTTPException

from src.models.pagination import PaginationResponse
from src.models.system import StatInfo, SystemResponse

# Set Windows-compatible event loop policy
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from loguru import logger
import pickle
from src.database import db
from src.constant import TableNames
from src.models.document import DocumentDetail, DocumentInfo, DocumentStatus


class WorkerClient:
    def __init__(self, parser_client, client_type):
        self.parser_client = parser_client
        self.client_type = client_type

    async def check_user_access_to_organization(
        self, organization_id: str, user_id: str, roles_allowed: list
    ) -> bool:
        await db.connect()
        async with db.connection() as conn:
            async with conn.cursor() as cur:
                try:
                    await cur.execute(
                        """
                        SELECT COUNT(*) FROM user_org 
                        WHERE user_id = %s AND org_id = %s AND role = ANY(%s);
                        """,
                        (user_id, organization_id, roles_allowed),
                    )
                    count = (await cur.fetchone())[0]
                    return count > 0
                except Exception as e:
                    logger.error(
                        f"Error checking user access to organization: {e}. Organization might not exist."
                    )
                    return False

    async def check_user_access_to_project(
        self,
        organization_id: str,
        project_id: str,
        user_id: str,
        roles_allowed: list,
    ) -> bool:
        await db.connect()
        async with db.connection() as conn:
            async with conn.cursor() as cur:
                try:
                    await cur.execute(
                        f"""
                        SELECT p.id 
                            FROM "{organization_id}".project p
                            WHERE p.id = %s 
                            AND EXISTS (
                                SELECT 1 
                                FROM user_org uo
                                WHERE uo.user_id = %s 
                                AND uo.org_id = %s 
                                AND uo.role = ANY(%s)
                            );
                        """,
                        (project_id, user_id, organization_id, roles_allowed),
                    )
                    count = await cur.fetchone()
                    return count is not None
                except Exception as e:
                    logger.error(
                        f"Error checking user access to project: {e}. Organization might not exist."
                    )
                    return False

    async def create_project(
        self, project_info: dict, organization_id: str, user_id: str
    ) -> str:
        await db.connect()
        async with db.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    f"""
                    INSERT INTO "{organization_id}".{TableNames.reserved_project_table_name} (name, description, created_by_user_id)
                    VALUES (%s, %s, %s)
                    RETURNING id;
                    """,
                    (
                        project_info.get("name"),
                        project_info.get("description", ""),
                        user_id,
                    ),
                )
                project_result = await cur.fetchone()
                if not project_result:
                    raise HTTPException(
                        status_code=500, detail="Failed to insert project"
                    )
                return str(project_result[0])

    async def insert_into_table(
        self, organization_id: str, project_id: str, user_id: str, insert_object: dict
    ) -> str:
        await db.connect()
        async with db.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    f"""
                    INSERT INTO "{organization_id}".{TableNames.reserved_document_table_name} (project_id, document_uploaded_name, metadata, document_bytes, status, parsed_document, summary, uploaded_by_user_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id;
                    """,
                    (
                        project_id,
                        insert_object.get("document_uploaded_name"),
                        json.dumps(insert_object.get("metadata")),
                        insert_object.get("document_bytes"),
                        DocumentStatus.PENDING.value,
                        insert_object.get("parsed_document", None),
                        insert_object.get("summary", None),
                        user_id,
                    ),
                )
                document_result = await cur.fetchone()
                if not document_result:
                    raise HTTPException(
                        status_code=500, detail="Failed to insert document"
                    )
                return str(document_result[0])

    async def get_organizations_ids(self):
        """
        Fetch all organization IDs (schemas) from the
        database. Assumes each organization has its own schema.
        Returns a list of organization IDs (schema names).
        """
        await db.connect()
        async with db.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("""
                        SELECT id FROM organizations;
                        """)
                org_ids = await cur.fetchall()
        org_ids = [str(org_id[0]) for org_id in org_ids]
        logger.info(f"Found {len(org_ids)} organizations in the database")
        return org_ids

    async def check_new_documents(self, organizations_ids):
        """
        Check for new documents to process in document tables across all organizations.
        Returns a list of documents with their schema and table names.
        """
        new_documents = []
        await db.connect()
        async with db.connection() as conn:
            for schemaname in organizations_ids:
                async with conn.cursor() as cur:
                    await cur.execute(
                        f"""
                        SELECT * FROM "{schemaname}".{TableNames.reserved_document_table_name} 
                        WHERE status = %s OR status = %s;
                        """,
                        (
                            DocumentStatus.PENDING.value,
                            DocumentStatus.QUEUED_PARSING.value,
                        ),
                    )
                    rows = await cur.fetchall()
                    if rows:
                        column_names = [desc[0] for desc in cur.description]
                        for row in rows:
                            doc = dict(zip(column_names, row))
                            doc_with_table = {
                                **doc,
                                "organization_id": schemaname,
                            }
                            new_documents.append(doc_with_table)
            logger.info(f"Found {len(new_documents)} new documents to process")
        return new_documents

    async def parse_documents(self, documents):
        """
        Parse the documents using the parser client.
        Returns a list of parsed documents and organization ids.
        """
        logger.info(f"Parsing {len(documents)} documents")
        parsed_documents, organizations_ids = [], []
        # TODO: add concurrent execution
        for document in documents:
            try:
                file_type = (
                    document.get("document_uploaded_name").split(".")[-1]
                    if document.get("document_uploaded_name")
                    and "." in document.get("document_uploaded_name")
                    else "pdf"
                )
                file_path = f"temp.{file_type}"
                with open(file_path, "wb") as f:
                    f.write(document.get("document_bytes"))
                metadata = dict(document.get("metadata", {}))
                parsed_document = await self.parser_client.aprocess_document(
                    file_path, extra_info=metadata
                )
                organization_id = document.get("organization_id")
                parsed_documents.append(parsed_document)
                organizations_ids.append(organization_id)
            except Exception as e:
                logger.error(f"Error parsing document: {e}")
                return [], []
        logger.info(
            f"Parsed {len(parsed_documents)} documents, {len(organizations_ids)} organizations"
        )
        return parsed_documents, organizations_ids

    async def upload_parsed_documents(self, parsed_documents, organizations_ids):
        """
        Upload the parsed documents to the database.
        This assumes that the parsed documents are in a format that can be directly inserted into the database.
        """
        await db.connect()
        async with db.connection() as conn:
            async with conn.transaction():
                async with conn.cursor() as cur:  # TODO:, check for id
                    for parsed_document, organization_id in zip(
                        parsed_documents, organizations_ids
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
                                doc_id = parsed_document.get("metadata", {}).get(
                                    "id", ""
                                )
                            if not doc_id or doc_id == "":
                                logger.warning(
                                    "Document ID not found in parsed_document metadata. Skipping document."
                                )
                                continue
                            await cur.execute(
                                f"""
                                UPDATE "{organization_id}".{TableNames.reserved_document_table_name}
                                SET processed = {DocumentStatus.QUEUED_EMBEDDING.value}, parsed_document = %s
                                WHERE id = %s;
                            """,
                                (
                                    pickle.dumps(parsed_document),
                                    doc_id,
                                ),
                            )
                            pgai_table_name = TableNames.reserved_pgai_table_name
                            await cur.execute(
                                f"""
                                INSERT INTO "{organization_id}".{pgai_table_name} 
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
                        except Exception as e:
                            logger.error(f"Error uploading parsed document: {e}")
                            return
        logger.info(
            f"Uploaded {len(parsed_documents)} parsed documents to the database"
        )

    async def get_all_projects(self, organization_id: str):
        await db.connect()
        async with db.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    f"""
                        SELECT id FROM "{organization_id}".{TableNames.reserved_project_table_name};
                        """,
                )
                projects = await cur.fetchall()
                return [str(project[0]) for project in projects]
                # column_names = [desc[0] for desc in cur.description]
                # projects_list = [
                #     dict(zip(column_names, project)) for project in projects
                # ]
                # return projects_list

    async def get_recent_documents_info(
        self, organization_id: str, projects: list, skip: int, limit: int
    ) -> PaginationResponse:
        await db.connect()
        async with db.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    f"""
                    SELECT COUNT(*) FROM "{organization_id}".{TableNames.reserved_document_table_name} as d
                    WHERE d.project_id = ANY(%s)
                """,
                    (projects,),
                )
                total_count = (await cur.fetchone())[0]
                await cur.execute(
                    f"""
                    SELECT d.id as document_id, d.document_uploaded_name, d.metadata, d.status, d.uploaded_by_user_id, d.created_at, d.project_id, p.name as project_name
                    FROM "{organization_id}".{TableNames.reserved_document_table_name} d
                    JOIN "{organization_id}".{TableNames.reserved_project_table_name} p
                    ON d.project_id = p.id
                    WHERE d.project_id = ANY(%s)
                    ORDER BY d.created_at DESC
                    LIMIT %s OFFSET %s
                """,
                    (projects, limit, skip),
                )
                documents = await cur.fetchall()
                column_names = [desc[0] for desc in cur.description]
                documents_info = [
                    DocumentInfo(
                        **dict(zip(column_names, doc), organization_id=organization_id)
                    )
                    for doc in documents
                ]

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
        self, organization_id: str, document_id: str
    ) -> DocumentDetail:
        await db.connect()
        async with db.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    f"""
                            SELECT id, parsed_document, document_uploaded_name, document_bytes, metadata, status, summary, created_at, uploaded_by_user_id FROM "{organization_id}".{TableNames.reserved_document_table_name}
                            WHERE id = %s;
                            """,
                    (document_id,),
                )
                document = await cur.fetchone()
                if not document:
                    raise HTTPException(status_code=404, detail="Document not found")
                (
                    id,
                    parsed_document,
                    document_uploaded_name,
                    document_bytes,
                    metadata,
                    status,
                    summary,
                    created_at,
                    uploaded_by_user_id,
                ) = document
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
                    document_name=document_uploaded_name,
                    document_type=document_uploaded_name.split(".")[-1]
                    if "." in document_uploaded_name
                    else "pdf",
                    metadata=metadata,
                    document_status=status,
                    document_id=id,
                    created_at=created_at,
                    parsed_markdown_text=parsed_markdown_text,
                    file_bytes=document_bytes,  # will be converted to base64
                    summary=summary if summary else "",
                    uploaded_by_user_id=uploaded_by_user_id,
                )

    async def get_projects_info(
        self, organization_id: str, projects: list
    ) -> PaginationResponse:
        await db.connect()
        async with db.connection() as conn:
            async with conn.cursor() as cur:
                # Single query for all projects
                await cur.execute(
                    f"""
                    SELECT p.id, p.name, p.description, COUNT(d.id) as doc_count
                    FROM "{organization_id}".{TableNames.reserved_project_table_name} p 
                    LEFT JOIN "{organization_id}".{TableNames.reserved_document_table_name} d
                    ON p.id = d.project_id
                    WHERE p.id = ANY(%s)
                    GROUP BY p.id, p.name, p.description
                    ORDER BY p.name;
                    """,
                    (projects,),
                )
                results = await cur.fetchall()

                projects_info_list = [
                    {
                        "project_id": str(row[0]),
                        "project_name": row[1],
                        "number_of_documents": row[3],
                        "description": row[2] or "",
                    }
                    for row in results
                ]

                logger.info(f"Projects info list: {projects_info_list}")

        return PaginationResponse(
            items=projects_info_list,
            total=len(projects_info_list),
            page=None,
            per_page=None,
            total_pages=1,
            has_next=False,
            has_previous=False,
        )

    async def get_stats(self, organization_id: str, projects: list) -> StatInfo:
        await db.connect()
        async with db.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    f"""
                            SELECT status, COUNT(status) FROM "{organization_id}".document
                            WHERE project_id = ANY(%s)
                            GROUP BY status
                            """,
                    (projects,),
                )

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
        await db.connect()
        async with db.connection() as conn:
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
