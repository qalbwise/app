from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class SearchCreate(BaseModel):
    topic: str


class SearchCreateResponse(BaseModel):
    slug: str
    cached: bool


class VerseResult(BaseModel):
    ayah_key: str
    surah_name: str
    arabic_text: str
    translation: str
    translator: str = "Saheeh International"
    relevance_score: float
    url: str
    why_this_verse: str | None = None
    tafsir_excerpt: str | None = None
    tafsir_author: str | None = None
    tafsir_edition: str | None = None


class SearchResponse(BaseModel):
    id: UUID
    slug: str
    topic: str
    status: str
    step: str | None = None
    search_count: int
    results: list[VerseResult] | None = None
    created_at: datetime


class SearchStreamEvent(BaseModel):
    status: str
    step: str | None = None
    results: list[dict[str, Any]] | None = None


class SearchListResponse(BaseModel):
    searches: list[SearchResponse]


class VersePageResponse(BaseModel):
    page: int
    total_pages: int
    verse: VerseResult
