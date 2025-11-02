import json
import sys
import asyncio
import uuid

# Set Windows-compatible event loop policy
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import os
from typing import List
from openai import AsyncOpenAI
from psycopg.rows import class_row
import re
import numpy as np
from src.configuration import Settings, config
from src.models.document import DocumentSearchResult
from src.database import db
from src.constant import TableNames

# TODO: move this elsewhere
os.environ["OPENAI_API_KEY"] = config.OPENAI_API_KEY
os.environ["OPENAI_BASE_URL"] = config.OPENAI_BASE_URL


class PGAIClient:
    def __init__(self, config: Settings = Settings()):
        self.config = config

    async def load_documents_to_db(self, organization_id, project_id, documents):
        """
        Load your parsed documents into the database.
        The vectorizer worker will automatically generate embeddings for these documents.
        """
        await db.connect()

        # Convert project_id once
        project_uuid = (
            uuid.UUID(project_id) if isinstance(project_id, str) else project_id
        )

        # Prepare all records in advance
        records = []
        for doc in documents:
            content = doc.text if hasattr(doc, "text") else str(doc)
            metadata = doc.metadata if hasattr(doc, "metadata") else []
            title = (
                metadata.get("title", "")
                if isinstance(metadata, dict)
                else getattr(metadata, "title", "")
            )
            records.append((title, metadata, content, project_uuid))

        # Single batch insert
        async with db.connection() as conn:
            async with conn.cursor() as cur:
                await cur.executemany(
                    f"""
                    INSERT INTO "{organization_id}".{TableNames.reserved_pgai_table_name} 
                    (title, metadata, text, project_id) 
                    VALUES (%s, %s, %s, %s)
                    """,
                    records,
                )
            await conn.commit()

    async def find_relevant_chunks(
        self, query: str, limit: int, organization_id: str, project_id: str
    ) -> List[DocumentSearchResult]:
        """
        Find the most relevant document chunks for a given query using vector similarity search.
        """
        text = re.sub(r'[^\w\s\-.,!?()[\]{}:;"\'@#$%^&*+=<>/\\|`~]', " ", query)
        # Normalize whitespace
        sanitized_query = " ".join(text.split())

        client = AsyncOpenAI(
            api_key=self.config.OPENAI_API_KEY, base_url=self.config.OPENAI_BASE_URL
        )
        response = await client.embeddings.create(
            model=self.config.OPENAI_EMBEDDING_MODEL,
            input=sanitized_query,
            encoding_format="float",
        )

        embedding = np.array(response.data[0].embedding)

        await db.connect()
        # Query the database for the most similar chunks using pgvector's cosine distance operator (<=>)
        async with db.connection() as conn:
            async with conn.cursor(row_factory=class_row(DocumentSearchResult)) as cur:
                # TODO: add metadata
                await cur.execute(
                    f"""
                        SELECT w.id, w.project_id, w.title, w.metadata, w.text, w.chunk, w.embedding <=> %s as distance
                            FROM "{organization_id}".{TableNames.reserved_pgai_table_name}_embedding w
                            WHERE w.project_id = %s
                            ORDER BY distance
                            LIMIT %s
                    """,
                    (embedding, project_id, limit),
                )
                results = await cur.fetchall()
                return results

    async def rag_query(self, query, limit, organization_id: str, project_id: str):
        """
        Perform RAG (Retrieval-Augmented Generation) using your documents.
        """

        relevant_chunks = await self.find_relevant_chunks(
            query, limit, organization_id, project_id
        )

        context = "\n\n".join(
            f"Document {json.dumps(chunk.metadata)}:\n{chunk.text}"
            for chunk in relevant_chunks
        )
        prompt = f"""Question: {query}

        Please use the following context from the documents to provide an accurate response:

        {context}

        Answer:"""
        client = AsyncOpenAI(
            api_key=config.OPENAI_API_KEY, base_url=config.OPENAI_BASE_URL
        )
        response = await client.chat.completions.create(
            model=config.OPENAI_MODEL, messages=[{"role": "user", "content": prompt}]
        )

        return response.choices[0].message.content
