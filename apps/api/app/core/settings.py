from functools import lru_cache

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


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
