from src.configuration import config
from src.constant import TableNames
from src.models.document import DocumentStatus


async def create_org_schema(cur, org_id: str):
    """
    Creates schema and tables for a new organization.
    """

    # Create schema
    await cur.execute(f'CREATE SCHEMA "{org_id}";')

    # Create project table
    await cur.execute(f"""
        CREATE TABLE "{org_id}".{TableNames.reserved_project_table_name} (
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
        CREATE TABLE "{org_id}".{TableNames.reserved_document_table_name} (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES "{org_id}".project(id) ON DELETE CASCADE,
            parsed_document BYTEA,
            document_uploaded_name TEXT,
            document_bytes BYTEA,
            metadata JSONB,
            status TEXT,
            summary TEXT,
            uploaded_by_user_id UUID,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at TIMESTAMPTZ,
            deleted_by_user_id UUID
        );
    """)

    # Create PGAI (wiki) table
    await cur.execute(f"""
                    CREATE TABLE IF NOT EXISTS "{org_id}".{TableNames.reserved_pgai_table_name} (
                        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
                        title TEXT NOT NULL,
                        metadata JSONB,
                        text TEXT NOT NULL,
                        project_id UUID,
                        deleted_at TIMESTAMPTZ
                    )
                """)
    # Create PGAI Vectorizer (embedding table)
    org_id_safe = f"org_{org_id.replace('-', '_')}"  # Convert UUID hyphens to underscores. Prefix with org_ for pgai vectorizer_name_check constraint
    await cur.execute(f""" 
                    SELECT ai.create_vectorizer(
                        '"{org_id}".{TableNames.reserved_pgai_table_name}'::regclass,
                        if_not_exists => true,
                        loading => ai.loading_column(column_name=>'text'),
                        embedding => ai.embedding_openai(model=>'{config.OPENAI_EMBEDDING_MODEL}',
                                                        dimensions=>{config.OPENAI_EMBEDDING_DIMENSIONS},
                                                        base_url=>'{config.OPENAI_BASE_URL}'),
                        destination => ai.destination_table(view_name=>'{TableNames.reserved_pgai_table_name}_embedding'),
                        name => '{org_id_safe}_vectorizer'
                    )
                """)
    # Create trigger to update document status after vectorization
    await cur.execute(f"""
            CREATE OR REPLACE FUNCTION update_embedding_status_{org_id_safe}()
            RETURNS TRIGGER AS $$
            DECLARE
                doc_id UUID;
            BEGIN
                -- Extract document_id from metadata in the view
                SELECT (metadata->>'id')::uuid INTO doc_id
                FROM "{org_id}".{TableNames.reserved_pgai_table_name}_embedding
                WHERE embedding_uuid = NEW.embedding_uuid
                LIMIT 1;
                
                -- Update document status if document_id was found
                IF doc_id IS NOT NULL THEN
                    UPDATE "{org_id}".{TableNames.reserved_document_table_name}
                    SET status = '{DocumentStatus.READY.value}'
                    WHERE id = doc_id;
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            
            DROP TRIGGER IF EXISTS after_vectorization ON "{org_id}".{TableNames.reserved_pgai_table_name}_embedding_store;
            
            CREATE TRIGGER after_vectorization
            AFTER INSERT ON "{org_id}".{TableNames.reserved_pgai_table_name}_embedding_store
            FOR EACH ROW
            EXECUTE FUNCTION update_embedding_status_{org_id_safe}();
        """)
