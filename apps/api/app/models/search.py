import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    canonical_query: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    embedding: Mapped[str | None] = mapped_column(Text, nullable=True)
    search_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    step: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC).replace(tzinfo=None)
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    results: Mapped[list["TopicResult"]] = relationship(
        back_populates="topic",
        cascade="all, delete-orphan",
        order_by="TopicResult.rank",
    )
    user_searches: Mapped[list["UserSearch"]] = relationship(
        back_populates="topic",
        cascade="all, delete-orphan",
    )


class TopicResult(Base):
    __tablename__ = "topic_results"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    topic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), index=True
    )
    ayah_key: Mapped[str] = mapped_column(String(20))
    surah_name: Mapped[str] = mapped_column(String(100))
    arabic_text: Mapped[str] = mapped_column(Text)
    translation: Mapped[str] = mapped_column(Text)
    why_this_verse: Mapped[str | None] = mapped_column(Text, nullable=True)
    rank: Mapped[int] = mapped_column(Integer)
    relevance_score: Mapped[float] = mapped_column(Float, default=0.0)
    url: Mapped[str] = mapped_column(Text)
    tafsir_excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    tafsir_author: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tafsir_edition: Mapped[str | None] = mapped_column(String(100), nullable=True)

    topic: Mapped[Topic] = relationship(back_populates="results")


class UserSearch(Base):
    __tablename__ = "user_searches"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    session_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    topic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"), index=True
    )
    user_query: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC).replace(tzinfo=None)
    )

    topic: Mapped[Topic] = relationship(back_populates="user_searches")
