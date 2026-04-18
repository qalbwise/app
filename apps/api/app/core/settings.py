from functools import lru_cache
from pathlib import Path
from typing import Any

from pydantic_settings import BaseSettings, SettingsConfigDict

# apps/api — where local `.env` usually lives (`moon run api:*` cwd is optional)
_API_ROOT = Path(__file__).resolve().parent.parent.parent
# Monorepo / workspace root (compose-style root `.env`)
_REPO_ROOT = _API_ROOT.parent.parent


class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    SECRET_KEY: str
    # OpenRouter uses an OpenAI-compatible API; key is typically sk-or-v1-...
    OPENAI_API_KEY: str | None = None
    OPENROUTER_API_KEY: str | None = None
    OPENAI_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENAI_CHAT_MODEL: str = "nvidia/nemotron-3-super-120b-a12b:free"
    # Optional OpenRouter attribution (https://openrouter.ai/docs)
    OPENROUTER_HTTP_REFERER: str | None = None
    OPENROUTER_APP_TITLE: str = "Qalbwise"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    GOOGLE_CLIENT_ID: str | None = None

    model_config = SettingsConfigDict(
        # Later files override earlier (apps/api `.env` wins over monorepo root).
        env_file=(
            tuple(
                str(p) for p in (_REPO_ROOT / ".env", _API_ROOT / ".env") if p.is_file()
            )
            or None
        ),
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


def llm_api_key(settings: Settings) -> str | None:
    return settings.OPENROUTER_API_KEY or settings.OPENAI_API_KEY


def llm_client_kwargs(settings: Settings) -> dict[str, Any]:
    """Kwargs for AsyncOpenAI (OpenRouter or other OpenAI-compatible endpoints)."""
    kwargs: dict[str, Any] = {
        "base_url": settings.OPENAI_BASE_URL.rstrip("/"),
        "api_key": llm_api_key(settings),
    }
    if settings.OPENROUTER_HTTP_REFERER:
        kwargs["default_headers"] = {
            "HTTP-Referer": settings.OPENROUTER_HTTP_REFERER,
            "X-Title": settings.OPENROUTER_APP_TITLE,
        }
    return kwargs
