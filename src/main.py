from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.configuration import Settings
from src.endpoints.document import router as document_router
from src.endpoints.project import router as project_router
from src.endpoints.retreival import router as retreival_router
from src.endpoints.system import router as system_router


def lifecycle_provider(settings: Settings):
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.settings = settings

        # TODO: add and implement app.pg_async_session to work across pgai_client and worker_client
        yield
        # TODO: use dependency.settings_provider for routes that require settings

    return lifespan


def create_app(settings: Settings = None):
    settings = settings or Settings()
    lifespan = lifecycle_provider(settings)

    app = FastAPI(lifespan=lifespan, title="llama-pg", version="0.1.0")

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

    return app
