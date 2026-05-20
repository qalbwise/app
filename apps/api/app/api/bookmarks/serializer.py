from datetime import datetime

from pydantic import BaseModel


class BookmarkCreate(BaseModel):
    ayah_key: str


class BookmarkResponse(BaseModel):
    id: str
    ayah_key: str
    type: str
    surah_number: int
    surah_name: str
    verse_number: int
    group: str | None = None
    is_in_default_collection: bool = True
    is_reading: bool | None = None
    collections_count: int | None = None
    created_at: datetime
    arabic_text: str = ""
    translation: str = ""


class BookmarkListResponse(BaseModel):
    bookmarks: list[BookmarkResponse]
