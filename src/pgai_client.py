import sys
import asyncio

# Set Windows-compatible event loop policy
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import os
from typing import List
from loguru import logger
import psycopg
from openai import AsyncOpenAI
from psycopg.rows import class_row
from pgvector.psycopg import register_vector_async
import pgai
import re
import numpy as np
from src.configuration import config
from src.constant import DocumentSearchResult
from psycopg_pool import AsyncConnectionPool

os.environ["OPENAI_API_KEY"] = config.VLLM_API_KEY
os.environ["OPENAI_BASE_URL"] = f"http://{config.VLLM_EMBEDDING_HOST}/v1"


# Create a connection pool to the database for efficient connection management
async def setup_pgvector_psycopg(conn: psycopg.AsyncConnection):
    await register_vector_async(conn)


pool = AsyncConnectionPool(
    config.DB_URL,
    min_size=config.DB_POOL_MIN_SIZE,
    max_size=config.DB_POOL_MIN_SIZE,
    open=False,
    max_idle=config.DB_POOL_IDLE_TIMEOUT,
    max_lifetime=config.DB_POOL_LIFETIME_TIMEOUT,
    configure=setup_pgvector_psycopg,
)


class PGAIClient:
    def __init__(self):
        pass

    async def define_schema(self, schema_name: str, table_name: str):
        """
        Create the wiki table if it doesn't exist.
        This table stores Wikipedia articles with their URLs, titles, and text content.
        """
        pgai.install(config.DB_URL)  # TODO -> move this elsewhere
        await pool.open()
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                # Check if the schema exists
                await cur.execute(
                    "SELECT schema_name FROM information_schema.schemata WHERE schema_name = %s",
                    (schema_name,),
                )
                schema_exists = await cur.fetchone()
                if not schema_exists:
                    logger.info(f"Schema '{schema_name}' does not exist. Creating it.")
                else:
                    logger.info(f"Schema '{schema_name}' already exists.")
                    raise ValueError(
                        f"Schema '{schema_name}' already exists. Please choose a different name."
                    )
                await cur.execute(f"""
                    CREATE SCHEMA IF NOT EXISTS {schema_name};
                    CREATE TABLE IF NOT EXISTS {schema_name}.{table_name} (
                        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
                        url TEXT NOT NULL,
                        title TEXT NOT NULL,
                        text TEXT NOT NULL
                    )
                """)

    async def create_vectorizer(self, schema_name, table_name="wiki"):
        """
        Create a vectorizer that defines how embeddings are generated from the wiki table.
        The vectorizer specifies:
        - The source table ('wiki')
        - The column to use for generating embeddings ('text')
        - The embedding model to use
        - The destination view for querying embeddings ('wiki_embedding')
        """
        await pool.open()
        async with pool.connection() as conn:
            async with (
                conn.cursor() as cur
            ):  # TODO: -> make model name and service (openai vs vllm) configurable
                await cur.execute(f""" 
                    SELECT ai.create_vectorizer(
                        '{schema_name}.{table_name}'::regclass,
                        if_not_exists => true,
                        loading => ai.loading_column(column_name=>'text'),
                        embedding => ai.embedding_openai(model=>'{config.VLLM_EMBEDDING_MODEL}',
                                                        dimensions=>1024,
                                                        base_url=>'http://{config.VLLM_EMBEDDING_HOST}/v1'),
                        destination => ai.destination_table(view_name=>'{table_name}_embedding')
                    )
                """)
                await conn.commit()

    async def load_documents_to_db(self, schema_name, vectorizer_table_name, documents):
        """
        Load your parsed documents into the database.
        The vectorizer worker will automatically generate embeddings for these documents.
        """
        await pool.open()
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                for doc in documents:
                    # Extract text content and metadata
                    content = doc.text if hasattr(doc, "text") else str(doc)
                    title = ""
                    url = ""

                    # Check for metadata and extract title and url safely
                    if hasattr(doc, "metadata") and doc.metadata:
                        title = (
                            doc.metadata.get("title", "")
                            if isinstance(doc.metadata, dict)
                            else getattr(doc.metadata, "title", "")
                        )
                        url = (
                            doc.metadata.get("url", "")
                            if isinstance(doc.metadata, dict)
                            else getattr(doc.metadata, "url", "")
                        )
                        logger.debug(title)
                        logger.debug(url)

                    await cur.execute(
                        f"INSERT INTO {schema_name}.{vectorizer_table_name} (url, title, text) VALUES (%s, %s, %s)",
                        (url, title, content),
                    )
            await conn.commit()

    async def find_relevant_chunks(
        self, query: str, limit: int, schema_name: str, table_name: str
    ) -> List[DocumentSearchResult]:
        """
        Find the most relevant document chunks for a given query using vector similarity search.

        Args:
            query: The search query
            limit: Maximum number of results to return

        Returns:
            List of DocumentSearchResult objects sorted by relevance
        """
        text = re.sub(r'[^\w\s\-.,!?()[\]{}:;"\'@#$%^&*+=<>/\\|`~]', " ", query)
        # Normalize whitespace
        sanitized_query = " ".join(text.split())

        logger.debug(sanitized_query)

        client = AsyncOpenAI(
            api_key=config.VLLM_API_KEY,
            base_url=f"http://{config.VLLM_EMBEDDING_HOST}/v1",
        )
        response = await client.embeddings.create(
            model=config.VLLM_EMBEDDING_MODEL,
            input=query,
            encoding_format="float",
        )

        embedding = np.array(response.data[0].embedding)

        await pool.open()
        # Query the database for the most similar chunks using pgvector's cosine distance operator (<=>)
        async with pool.connection() as conn:
            async with conn.cursor(row_factory=class_row(DocumentSearchResult)) as cur:
                await cur.execute(
                    f"""
                        SELECT w.id, w.url, w.title, w.text, w.chunk, w.embedding <=> %s as distance
                            FROM {schema_name}.{table_name} w
                            ORDER BY distance
                            LIMIT %s
                    """,
                    (embedding, limit),
                )

                return await cur.fetchall()

    async def rag_query(self, query, limit, schema_name, table_name="wiki_embedding"):
        """
        Perform RAG (Retrieval-Augmented Generation) using your documents.
        """

        relevant_chunks = await self.find_relevant_chunks(
            query, limit, schema_name, table_name
        )

        context = "\n\n".join(
            f"Document {chunk.url}:\n{chunk.text}" for chunk in relevant_chunks
        )
        prompt = f"""Question: {query}

        Please use the following context from the documents to provide an accurate response:

        {context}

        Answer:"""
        client = AsyncOpenAI(
            api_key=config.VLLM_API_KEY,
            base_url=f"http://{config.VLLM_MODEL_HOST}/v1",
        )
        response = await client.chat.completions.create(
            model=config.VLLM_MODEL, messages=[{"role": "user", "content": prompt}]
        )

        return response.choices[0].message.content
