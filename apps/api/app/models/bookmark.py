import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    ayah_key: Mapped[str] = mapped_column(String(20))
    surah_name: Mapped[str] = mapped_column(String(100))
    arabic_text: Mapped[str] = mapped_column(Text)
    translation: Mapped[str] = mapped_column(Text)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    extra_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    topic: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    verses: Mapped[list[dict] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
