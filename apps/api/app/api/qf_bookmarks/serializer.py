from datetime import datetime

from pydantic import BaseModel


class QfBookmarkCreate(BaseModel):
    ayah_key: str


class QfBookmarkResponse(BaseModel):
    id: str
    ayah_key: str
    type: str
    surah_number: int
    verse_number: int
    group: str | None = None
    is_in_default_collection: bool = True
    is_reading: bool | None = None
    collections_count: int | None = None
    created_at: datetime


class QfBookmarkListResponse(BaseModel):
    bookmarks: list[QfBookmarkResponse]
