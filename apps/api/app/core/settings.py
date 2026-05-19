from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Get the root directory of the project (5 levels up from this file)
ROOT_DIR = Path(__file__).parent.parent.parent.parent.parent


class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    SECRET_KEY: str
    OPENAI_API_KEY: str | None = None
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    GOOGLE_CLIENT_ID: str | None = None

    QF_CLIENT_ID: str = ""
    QF_CLIENT_SECRET: str = ""
    QF_AUTH_BASE_URL: str = "https://prelive-oauth2.quran.foundation"
    QF_API_BASE_URL: str = "https://apis-prelive.quran.foundation"
    QF_REDIRECT_URI: str = ""
    QF_MUSHAF_ID: int = 4
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=str(ROOT_DIR / ".env"), extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
