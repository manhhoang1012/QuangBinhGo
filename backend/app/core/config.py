from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "QuangBinhGo"
    app_env: str = "development"
    debug: bool = Field(default=True, alias="APP_DEBUG")
    api_v1_prefix: str = "/api/v1"
    cors_origins_raw: str = Field(default="http://localhost:5173,http://127.0.0.1:5173", alias="CORS_ORIGINS")

    database_url: str = "postgresql+psycopg://quangbinhgo:quangbinhgo@localhost:5432/quangbinhgo"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60

    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    google_client_id: str = ""
    google_client_secret: str = ""
    facebook_client_id: str = ""
    facebook_client_secret: str = ""
    frontend_url: str = "http://localhost:5173"
    backend_url: str = "http://localhost:8000"

    email_provider: str = "dev"
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "QuangBinhGo"

    pinecone_api_key: str = ""
    pinecone_index_name: str = "quangbinhgo-review-posts"
    sentence_transformer_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    auto_create_tables: bool = Field(default=True, alias="AUTO_CREATE_TABLES")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    loaded_settings = Settings()
    if loaded_settings.app_env.lower() in {"production", "prod"} and loaded_settings.secret_key == "change-me":
        raise RuntimeError("JWT secret_key must be configured in production. Set SECRET_KEY in .env.")
    return loaded_settings


settings = get_settings()
