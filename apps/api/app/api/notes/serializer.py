from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


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
