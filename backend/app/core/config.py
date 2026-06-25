from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "local"

    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432

    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Prompt AI App"

    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    FIRST_ADMIN_FULL_NAME: str = "Администратор"
    FIRST_ADMIN_USERNAME: str = "admin"
    FIRST_ADMIN_EMAIL: str = "admin@example.com"
    FIRST_ADMIN_PASSWORD: str = "admin12345"
    FIRST_ADMIN_ORG: str = "Администрация"

    GIGACHAT_AUTH_KEY: str
    GIGACHAT_SCOPE: str = "GIGACHAT_API_PERS"
    GIGACHAT_MODEL: str = "GigaChat"
    GIGACHAT_VERIFY_SSL: bool = True
    GIGACHAT_CA_BUNDLE: str | None = None
    GIGACHAT_TIMEOUT_SECONDS: int = 60

    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str = "rpc://"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def database_url(self) -> str:
        """
        Синхронный URL.
        Используется Alembic.
        """
        return (
            f"postgresql+psycopg://{self.POSTGRES_USER}:"
            f"{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:"
            f"{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def async_database_url(self) -> str:
        """
        Асинхронный URL.
        Используется FastAPI-приложением.
        """
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:"
            f"{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:"
            f"{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()