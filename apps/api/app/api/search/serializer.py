from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class SearchCreate(BaseModel):
    topic: str


class VerseResult(BaseModel):
    ayah_key: str
    surah_name: str
    arabic_text: str
    translation: str
    translator: str
    relevance_score: float
    url: str
    why_this_verse: str | None = None


class SearchResponse(BaseModel):
    id: UUID
    slug: str
    topic: str
    status: str
    step: str | None = None
    results: list[VerseResult] | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SearchStreamEvent(BaseModel):
    status: str
    step: str | None = None
    results: list[dict[str, Any]] | None = None


class SearchListResponse(BaseModel):
    searches: list[SearchResponse]


class VerseExplainResponse(BaseModel):
    ayah_key: str
    why_this_verse: str


class TafsirResponse(BaseModel):
    ayah_key: str
    tafsir: str
    source: str | None = None
