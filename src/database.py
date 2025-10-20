import pgai
import sys
import asyncio
from psycopg_pool import AsyncConnectionPool
from pgvector.psycopg import register_vector_async
import psycopg
from contextlib import asynccontextmanager
from src.configuration import config

# Set Windows-compatible event loop policy
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


class Database:
    def __init__(self):
        self.pool: AsyncConnectionPool | None = None

    async def setup_pgvector_psycopg(self, conn: psycopg.AsyncConnection):
        await register_vector_async(conn)

    async def connect(self):
        """Initialize the connection pool"""
        if self.pool is None:
            self.pool = AsyncConnectionPool(
                config.DB_URL,
                min_size=config.DB_POOL_MIN_SIZE,
                max_size=config.DB_POOL_MAX_SIZE,
                open=False,
                max_idle=config.DB_POOL_IDLE_TIMEOUT,
                max_lifetime=config.DB_POOL_LIFETIME_TIMEOUT,
                configure=self.setup_pgvector_psycopg,
            )
            await self.pool.open()
            pgai.install(config.DB_URL)

    async def disconnect(self):
        """Close the connection pool"""
        if self.pool is not None:
            await self.pool.close()
            self.pool = None

    @asynccontextmanager
    async def connection(self):
        """Get a connection from the pool"""
        if self.pool is None:
            raise RuntimeError("Database not connected")
        async with self.pool.connection() as conn:
            yield conn

    @asynccontextmanager
    async def cursor(self):
        """Get a connection and cursor"""
        async with self.connection() as conn:
            async with conn.cursor() as cur:
                yield cur


# Singleton instance
db = Database()
