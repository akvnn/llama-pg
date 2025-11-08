from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.configuration import Settings

from src.endpoints.document import router as document_router
from src.endpoints.project import router as project_router
from src.endpoints.retreival import router as retreival_router
from src.endpoints.system import router as system_router
from src.endpoints.user import router as user_router, signup
from src.models.user import UserRequest
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


async def ensure_pgai_installed(pool: AsyncConnectionPool, settings: Settings) -> None:
    """Install pgai only if not already present"""
    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'ai';"
                )
                result = await cur.fetchone()
                exists = result[0] if result else False
                if not exists:
                    logger.info("Installing pgai...")
                    pgai.install(
                        settings.DB_URL
                    )  # install the necessary catalog tables and functions into the ai schema of the database.
                else:
                    logger.info("pgai already installed, skipping")
    except Exception as e:
        logger.error(f"Error installing pgai: {str(e)}")


async def create_default_admin(
    pool: AsyncConnectionPool, username: str, password: str
) -> None:
    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "SELECT id FROM users WHERE username = %s;",
                    (username,),
                )
                if await cur.fetchone():
                    logger.info("Admin user already exists")
                    return

        await signup(
            UserRequest(username=username, password=password),
            pool,
        )
        logger.info(f"Default admin user '{username}' created")
    except Exception as e:
        logger.error(f"Error creating admin user: {str(e)}")


def lifecycle_provider(settings: Settings):
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        try:
            app.settings = settings
            app.pool = AsyncConnectionPool(
                settings.DB_URL,
                min_size=settings.DB_POOL_MIN_SIZE,
                max_size=settings.DB_POOL_MAX_SIZE,
                open=False,
                max_idle=settings.DB_POOL_IDLE_TIMEOUT,
                max_lifetime=settings.DB_POOL_LIFETIME_TIMEOUT,
                configure=setup_pgvector_psycopg,
            )
            await app.pool.open()

            await ensure_pgai_installed(app.pool, settings)

            if settings.CREATE_DEFAULT_ADMIN_USER:
                await create_default_admin(
                    app.pool,
                    username=settings.ADMIN_USERNAME,
                    password=settings.ADMIN_PASSWORD,
                )

            # Initialize the clients
            if settings.USE_LLAMA_PARSE:
                app.parser_client = LlamaParseClient(
                    auto_mode=settings.LLAMA_PARSE_AUTO_MODE
                )
            else:
                app.parser_client = None

            app.worker_client = WorkerClient(
                app.parser_client, client_type=app.parser_client.__class__.__name__
            )
            app.pgai_client = PGAIClient()

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
