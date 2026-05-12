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
    debug: bool = True
    api_v1_prefix: str = "/api/v1"
    cors_origins_raw: str = Field(default="http://localhost:5173", alias="CORS_ORIGINS")

    database_url: str = "postgresql+psycopg://quangbinhgo:quangbinhgo@localhost:5432/quangbinhgo"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60

    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    pinecone_api_key: str = ""
    pinecone_index_name: str = "quangbinhgo-places"
    sentence_transformer_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
