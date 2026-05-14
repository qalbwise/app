from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class BookmarkCreate(BaseModel):
    ayah_key: str
    surah_name: str
    arabic_text: str
    translation: str
    note: str | None = None
    extra_data: dict | None = None


class BookmarkResponse(BaseModel):
    id: UUID
    ayah_key: str
    surah_name: str
    arabic_text: str
    translation: str
    note: str | None = None
    extra_data: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BookmarkListResponse(BaseModel):
    bookmarks: list[BookmarkResponse]


class NoteCreate(BaseModel):
    topic: str
    content: str
    verses: list[dict] | None = None


class NoteResponse(BaseModel):
    id: UUID
    topic: str
    content: str
    verses: list[dict] | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NoteListResponse(BaseModel):
    notes: list[NoteResponse]
