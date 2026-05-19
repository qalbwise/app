from datetime import datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.qf_bookmarks.serializer import QfBookmarkResponse
from app.core.settings import get_settings
from app.models.user import User
from app.modules.auth import qf_service

DEFAULT_COLLECTION_ID = "__default__"


def parse_ayah_key(ayah_key: str) -> tuple[int, int]:
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

    return surah_number, verse_number


async def get_qf_access_token(db: AsyncSession, current_user: User) -> str:
    access_token = await qf_service.get_valid_qf_access_token(db, current_user)
    if access_token is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Connect Quran Foundation to use QF bookmarks",
        )
    return access_token


def normalize_qf_bookmark(raw: dict[str, Any]) -> QfBookmarkResponse:
    surah_number = int(raw["key"])
    verse_number = int(raw["verseNumber"])
    created_at_raw = raw.get("createdAt")
    created_at = (
        datetime.fromisoformat(created_at_raw.replace("Z", "+00:00"))
        if isinstance(created_at_raw, str)
        else datetime.now()
    )

    return QfBookmarkResponse(
        id=str(raw["id"]),
        ayah_key=f"{surah_number}:{verse_number}",
        type=str(raw.get("type", "ayah")),
        surah_number=surah_number,
        verse_number=verse_number,
        group=raw.get("group"),
        is_in_default_collection=bool(raw.get("isInDefaultCollection", True)),
        is_reading=raw.get("isReading"),
        collections_count=raw.get("collectionsCount"),
        created_at=created_at,
    )


async def list_qf_bookmarks(
    db: AsyncSession,
    current_user: User,
) -> list[QfBookmarkResponse]:
    access_token = await get_qf_access_token(db, current_user)
    settings = get_settings()
    data = await qf_service.call_qf_api(
        access_token,
        "/v1/bookmarks",
        params={
            "type": "ayah",
            "mushafId": settings.QF_MUSHAF_ID,
            "first": 20,
        },
    )
    if data is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to fetch QF bookmarks",
        )

    bookmarks = data.get("data", [])
    if not isinstance(bookmarks, list):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unexpected QF bookmarks response",
        )

    return [
        normalize_qf_bookmark(bookmark)
        for bookmark in bookmarks
        if bookmark.get("type") == "ayah"
        and bookmark.get("verseNumber") is not None
        and bookmark.get("isInDefaultCollection", True)
    ]


async def create_qf_bookmark(
    db: AsyncSession,
    current_user: User,
    ayah_key: str,
) -> QfBookmarkResponse:
    surah_number, verse_number = parse_ayah_key(ayah_key)
    access_token = await get_qf_access_token(db, current_user)
    settings = get_settings()
    data = await qf_service.call_qf_api(
        access_token,
        f"/v1/collections/{DEFAULT_COLLECTION_ID}/bookmarks",
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
            detail="Failed to create QF bookmark",
        )

    bookmarks = await list_qf_bookmarks(db, current_user)
    for bookmark in bookmarks:
        if (
            bookmark.surah_number == surah_number
            and bookmark.verse_number == verse_number
        ):
            return bookmark

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="QF bookmark was created but could not be read back",
    )


async def delete_qf_bookmark(
    db: AsyncSession,
    current_user: User,
    bookmark_id: str,
) -> None:
    access_token = await get_qf_access_token(db, current_user)
    data = await qf_service.call_qf_api(
        access_token,
        f"/v1/collections/{DEFAULT_COLLECTION_ID}/bookmarks/{bookmark_id}",
        method="DELETE",
    )
    if data is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to delete QF bookmark",
        )
