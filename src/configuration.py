from pydantic_settings import BaseSettings, SettingsConfigDict
from arq.connections import RedisSettings


class Settings(BaseSettings):
    """Configuration"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )
    LLAMA_CLOUD_API_KEY: str | None = None
    DB_URL: str | None = (
        None  # must follow the format: postgresql://{config.PG_USER}:{config.PG_PASSWORD}@{config.PG_HOST}:{config.PG_PORT}/{config.PG_DBNAME}
    )
    VLLM_API_KEY: str = "some_dummy_key"
    VLLM_EMBEDDING_MODEL: str = "BAAI/bge-m3"
    VLLM_EMBEDDING_HOST: str | None = None
    VLLM_MODEL: str | None = None
    VLLM_MODEL_HOST: str | None = None

    USE_LLAMA_PARSE: bool = True
    LLAMA_PARSE_AUTO_MODE: bool = True

    API_PORT: int = 8000

    REDIS_ARQ_HOST: str | None = None
    REDIS_ARQ_PORT: int | None = None
    REDIS_ARQ_DATABASE: int | None = None
    REDIS_ARQ_MAX_JOBS: int = 10

    @property
    def REDIS_ARQ_SETTINGS(self):
        return RedisSettings(
            host=self.REDIS_ARQ_HOST,
            port=self.REDIS_ARQ_PORT,
            database=self.REDIS_ARQ_DATABASE,
        )


config = Settings()
