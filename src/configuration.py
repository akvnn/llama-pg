from pydantic_settings import BaseSettings, SettingsConfigDict
from arq.connections import RedisSettings


class Settings(BaseSettings):
    """Configuration"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )
    # PostgreSQL Configuration
    DB_URL: str = (
        "postgresql://postgres:password@postgres:5432/postgres"  # must follow the format: postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DBNAME}
    )
    DB_POOL_MIN_SIZE: int = 5
    DB_POOL_MAX_SIZE: int = 10
    DB_POOL_IDLE_TIMEOUT: int = 300
    DB_POOL_LIFETIME_TIMEOUT: int = 1800

    # Security Configuration
    JWT_EXPIRES_IN: int = 3600  # in seconds
    JWT_SECRET_KEY: str = "some_dummy_key"

    # OpenAI/vLLM Configuration
    OPENAI_API_KEY: str = "some_dummy_key"  # used for both OpenAI and vLLM
    OPENAI_EMBEDDING_MODEL: str = (
        "text-embedding-3-small"  # used for both OpenAI and vLLM
    )
    OPENAI_MODEL: str = "gpt-5"  # used for both OpenAI and vLLM
    OPENAI_HOST: str = "https://api.openai.com/v1"  # used for both OpenAI and vLLM
    USE_VLLM: bool = False

    # Parser Configuration
    USE_LLAMA_PARSE: bool = True
    LLAMA_CLOUD_API_KEY: str | None = None
    LLAMA_PARSE_AUTO_MODE: bool = True

    # API Configuration
    API_PORT: int = 8000

    # Worker Configuration
    REDIS_ARQ_HOST: str = "redis"
    REDIS_ARQ_PORT: int = 6379
    REDIS_ARQ_DATABASE: int = 0
    REDIS_ARQ_MAX_JOBS: int = 10

    @property
    def REDIS_ARQ_SETTINGS(self):
        return RedisSettings(
            host=self.REDIS_ARQ_HOST,
            port=self.REDIS_ARQ_PORT,
            database=self.REDIS_ARQ_DATABASE,
        )

    @property
    def OPENAI_BASE_URL(self) -> str:
        if self.USE_VLLM and self.OPENAI_HOST:
            return f"http://{self.OPENAI_HOST}/v1"
        return self.OPENAI_HOST


config = Settings()
