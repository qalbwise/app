from datetime import datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.bookmarks.serializer import BookmarkResponse
from app.core.settings import get_settings
from app.models.user import User
from app.modules.auth import qf_service


def _get_surah_name(chapters: dict[int, str], number: int) -> str:
    return chapters.get(number, f"Surah {number}")


def _normalize_qf_bookmark(
    raw: dict[str, Any], chapters: dict[int, str]
) -> BookmarkResponse:
    surah_number = int(raw["key"])
    verse_number = int(raw["verseNumber"])
    created_at_raw = raw.get("createdAt")
    created_at = (
        datetime.fromisoformat(created_at_raw.replace("Z", "+00:00"))
        if isinstance(created_at_raw, str)
        else datetime.now()
    )

    return BookmarkResponse(
        id=str(raw["id"]),
        ayah_key=f"{surah_number}:{verse_number}",
        type=str(raw.get("type", "ayah")),
        surah_number=surah_number,
        surah_name=_get_surah_name(chapters, surah_number),
        verse_number=verse_number,
        group=raw.get("group"),
        is_in_default_collection=bool(raw.get("isInDefaultCollection", True)),
        is_reading=raw.get("isReading"),
        collections_count=raw.get("collectionsCount"),
        created_at=created_at,
    )


async def list_bookmarks(
    db: AsyncSession,
    current_user: User,
) -> list[BookmarkResponse]:
    access_token = await qf_service.get_valid_qf_access_token(db, current_user)
    if access_token is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Connect Quran Foundation to use bookmarks",
        )

    settings = get_settings()
    data = await qf_service.call_qf_api(
        access_token,
        "/auth/v1/bookmarks",
        params={"type": "ayah", "first": 20, "mushafId": settings.QF_MUSHAF_ID},
    )

    if data is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to fetch bookmarks from Quran Foundation",
        )

    bookmarks = data.get("data", [])
    if not isinstance(bookmarks, list):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unexpected bookmarks response",
        )

    chapters = await qf_service.fetch_chapters() or {}

    normalized = [
        _normalize_qf_bookmark(b, chapters)
        for b in bookmarks
        if b.get("type") == "ayah" and b.get("verseNumber") is not None
    ]

    if normalized:
        verse_keys = [b.ayah_key for b in normalized]
        verses = await qf_service.fetch_verses_by_keys(
            verse_keys, settings.QF_MUSHAF_ID
        )
        for b in normalized:
            verse_data = verses.get(b.ayah_key, {})
            b.arabic_text = verse_data.get("arabic_text", "")
            b.translation = verse_data.get("translation", "")

    return normalized


async def create_bookmark(
    db: AsyncSession,
    current_user: User,
    ayah_key: str,
) -> BookmarkResponse:
    parts = ayah_key.strip().split(":")
    if len(parts) != 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ayah_key must use surah:ayah format, for example 2:255",
        )

    try:
        surah_number = int(parts[0])
        verse_number = int(parts[1])
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ayah_key must contain numeric surah and ayah values",
        ) from exc

    if surah_number < 1 or verse_number < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ayah_key values must be positive numbers",
        )

    access_token = await qf_service.get_valid_qf_access_token(db, current_user)
    if access_token is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Connect Quran Foundation to use bookmarks",
        )

    settings = get_settings()
    data = await qf_service.call_qf_api(
        access_token,
        "/auth/v1/bookmarks",
        method="POST",
        json_body={
            "type": "ayah",
            "key": surah_number,
            "verseNumber": verse_number,
            "mushafId": settings.QF_MUSHAF_ID,
        },
    )

    if data is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to create bookmark on Quran Foundation",
        )

    verses = await qf_service.fetch_verses_by_keys([ayah_key], settings.QF_MUSHAF_ID)
    verse_data = verses.get(ayah_key, {})
    chapters = await qf_service.fetch_chapters() or {}

    return BookmarkResponse(
        id=str(data.get("data", {}).get("id", "")),
        ayah_key=ayah_key,
        type="ayah",
        surah_number=surah_number,
        surah_name=_get_surah_name(chapters, surah_number),
        verse_number=verse_number,
        created_at=datetime.now(),
        arabic_text=verse_data.get("arabic_text", ""),
        translation=verse_data.get("translation", ""),
    )


async def delete_bookmark(
    db: AsyncSession,
    current_user: User,
    bookmark_id: str,
) -> None:
    access_token = await qf_service.get_valid_qf_access_token(db, current_user)
    if access_token is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Connect Quran Foundation to use bookmarks",
        )

    data = await qf_service.call_qf_api(
        access_token,
        f"/auth/v1/bookmarks/{bookmark_id}",
        method="DELETE",
    )

    if data is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to delete bookmark from Quran Foundation",
        )
