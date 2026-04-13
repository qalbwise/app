from datetime import date, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bookmark import Bookmark, Note, Streak


async def create_bookmark(
    db: AsyncSession,
    user_id: UUID,
    ayah_key: str,
    surah_name: str,
    arabic_text: str,
    translation: str,
    note: str | None = None,
    extra_data: dict | None = None,
) -> Bookmark:
    bookmark = Bookmark(
        user_id=user_id,
        ayah_key=ayah_key,
        surah_name=surah_name,
        arabic_text=arabic_text,
        translation=translation,
        note=note,
        extra_data=extra_data,
    )
    db.add(bookmark)
    await db.commit()
    await db.refresh(bookmark)
    return bookmark


async def get_bookmarks(db: AsyncSession, user_id: UUID) -> list[Bookmark]:
    result = await db.execute(
        select(Bookmark)
        .where(Bookmark.user_id == user_id)
        .order_by(Bookmark.created_at.desc())
    )
    return list(result.scalars().all())


async def delete_bookmark(db: AsyncSession, bookmark_id: UUID, user_id: UUID) -> bool:
    result = await db.execute(
        select(Bookmark).where(Bookmark.id == bookmark_id, Bookmark.user_id == user_id)
    )
    bookmark = result.scalar_one_or_none()
    if not bookmark:
        return False
    await db.delete(bookmark)
    await db.commit()
    return True


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
    note.updated_at = datetime.utcnow()
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


async def get_or_create_streak(db: AsyncSession, user_id: UUID) -> Streak:
    result = await db.execute(select(Streak).where(Streak.user_id == user_id))
    streak = result.scalar_one_or_none()
    if not streak:
        streak = Streak(user_id=user_id)
        db.add(streak)
        await db.commit()
        await db.refresh(streak)
    return streak


async def record_activity(db: AsyncSession, user_id: UUID) -> Streak:
    streak = await get_or_create_streak(db, user_id)
    today = date.today()

    if streak.last_activity_date == today:
        return streak

    yesterday = today - timedelta(days=1)

    if streak.last_activity_date == yesterday:
        streak.current_streak += 1
    else:
        streak.current_streak = 1

    if streak.current_streak > streak.longest_streak:
        streak.longest_streak = streak.current_streak

    streak.last_activity_date = today
    streak.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(streak)
    return streak
