import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.configuration import Settings

from src.endpoints.document import router as document_router
from src.endpoints.project import router as project_router
from src.endpoints.retreival import router as retreival_router
from src.endpoints.system import router as system_router
from src.endpoints.user import router as user_router
from src.configuration import config
import psycopg
from psycopg_pool import AsyncConnectionPool
from pgvector.psycopg import register_vector_async
from loguru import logger
import pgai
from src.lp_client import LlamaParseClient
from src.pgai_client import PGAIClient
from src.worker_client import WorkerClient


# Create a connection pool to the database for efficient connection management
async def setup_pgvector_psycopg(conn: psycopg.AsyncConnection):
    await register_vector_async(conn)


def lifecycle_provider(settings: Settings):
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        try:
            app.settings = settings
            app.pool = AsyncConnectionPool(
                config.DB_URL,
                min_size=config.DB_POOL_MIN_SIZE,
                max_size=config.DB_POOL_MAX_SIZE,
                open=False,
                max_idle=config.DB_POOL_IDLE_TIMEOUT,
                max_lifetime=config.DB_POOL_LIFETIME_TIMEOUT,
                configure=setup_pgvector_psycopg,
            )
            pgai.install(config.DB_URL)
            await app.pool.open()

            # Initialize the clients
            if config.USE_LLAMA_PARSE:
                app.parser_client = LlamaParseClient(
                    auto_mode=config.LLAMA_PARSE_AUTO_MODE
                )
            else:
                app.parser_client = None
            yield
        finally:
            await app.pool.close()
            logger.info("Shutting down application...")
            

    return lifespan


def create_app(settings: Settings = None):
    settings = settings or Settings()
    lifespan = lifecycle_provider(settings)

    app = FastAPI(lifespan=lifespan, title="llama-pg", version="0.1.0")

    logger.info("Starting application...")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(document_router)
    app.include_router(project_router)
    app.include_router(retreival_router)
    app.include_router(system_router)
    app.include_router(user_router)

    return app
