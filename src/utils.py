from src.configuration import config
from src.constant import TableNames


async def create_org_schema(cur, org_id: str):
    """
    Creates schema and tables for a new organization.
    """

    # Create schema
    await cur.execute(f'CREATE SCHEMA "{org_id}";')

    # Create project table
    await cur.execute(f"""
        CREATE TABLE "{org_id}".project (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT,
            description TEXT,
            created_by_user_id UUID,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)

    # Create document table
    await cur.execute(f"""
        CREATE TABLE "{org_id}".document (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES "{org_id}".project(id) ON DELETE CASCADE,
            parsed_document TEXT,
            document_uploaded_name TEXT,
            document_bytes BYTEA,
            metadata JSONB,
            status TEXT,
            summary TEXT,
            uploaded_by_user_id UUID,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)

    # Create PGAI (wiki) table

    await cur.execute(f"""
                    CREATE TABLE IF NOT EXISTS "{org_id}".{TableNames.reserved_pgai_table_name} (
                        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
                        title TEXT NOT NULL,
                        metadata JSONB,
                        text TEXT NOT NULL,
                        project_id UUID
                    )
                """)
    # Create PGAI Vectorizer (embedding table)
    await cur.execute(f""" 
                    SELECT ai.create_vectorizer(
                        '"{org_id}".{TableNames.reserved_pgai_table_name}'::regclass,
                        if_not_exists => true,
                        loading => ai.loading_column(column_name=>'text'),
                        embedding => ai.embedding_openai(model=>'{config.OPENAI_EMBEDDING_MODEL}',
                                                        dimensions=>1024,
                                                        base_url=>'{config.OPENAI_BASE_URL}'),
                        destination => ai.destination_table(view_name=>'{TableNames.reserved_pgai_table_name}_embedding'),
                        name => '{TableNames.reserved_pgai_table_name}_vectorizer'
                    )
                """)
