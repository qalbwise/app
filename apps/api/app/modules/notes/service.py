from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.note import Note


async def create_note(
    db: AsyncSession,
    user_id: UUID,
    topic: str,
    content: str,
    verses: list[dict[str, Any]] | None = None,
) -> Note:
    note = Note(
        user_id=user_id,
        topic=topic,
        content=content,
        verses=verses,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


async def get_notes(db: AsyncSession, user_id: UUID) -> list[Note]:
    result = await db.execute(
        select(Note).where(Note.user_id == user_id).order_by(Note.created_at.desc())
    )
    return list(result.scalars().all())


async def update_note(
    db: AsyncSession,
    note_id: UUID,
    user_id: UUID,
    content: str | None = None,
) -> Note | None:
    result = await db.execute(
        select(Note).where(Note.id == note_id, Note.user_id == user_id)
    )
    note = result.scalar_one_or_none()
    if not note:
        return None

    if content:
        note.content = content
    note.updated_at = datetime.now(UTC).replace(tzinfo=None)
    await db.commit()
    await db.refresh(note)
    return note


async def delete_note(db: AsyncSession, note_id: UUID, user_id: UUID) -> bool:
    result = await db.execute(
        select(Note).where(Note.id == note_id, Note.user_id == user_id)
    )
    note = result.scalar_one_or_none()
    if not note:
        return False
    await db.delete(note)
    await db.commit()
    return True
