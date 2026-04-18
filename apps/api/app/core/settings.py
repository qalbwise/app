from functools import lru_cache
from typing import Any

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


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
    # Comma-separated; merged with built-in prod + local dev origins.
    CORS_EXTRA_ORIGINS: str = ""

    model_config = ConfigDict(env_file=".env", extra="ignore")


FORBIDDEN_SEARCH_WORDS = {
    "fuck",
    "fucked",
    "fucking",
    "f*ck",
    "f**k",
    "fck",
    "nigga",
    "nigger",
    "n1gga",
    "n1gg4",
    "ngga",
    "bastard",
    "b4stard",
    "bastrd",
    "dick",
    "d1ck",
    "d!ck",
    "dck",
    "bitch",
    "b1tch",
    "b!tch",
    "asshole",
    "a$$hole",
    "@sshole",
    "shit",
    "sh1t",
    "sh!t",
}


def is_leet_speak_variant(word: str, forbidden_word: str) -> bool:
    normalized = (
        word.lower()
        .replace("1", "i")
        .replace("3", "e")
        .replace("@", "a")
        .replace("$", "s")
        .replace("!", "i")
        .replace("0", "o")
        .replace("4", "a")
        .replace("5", "s")
        .replace("7", "t")
    )
    return normalized == forbidden_word.lower()


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
