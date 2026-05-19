from datetime import datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.bookmarks.serializer import BookmarkResponse
from app.core.settings import get_settings
from app.models.user import User
from app.modules.auth import qf_service

SURAHS: dict[int, str] = {
    1: "Al-Fatihah",
    2: "Al-Baqarah",
    3: "Ali 'Imran",
    4: "An-Nisa",
    5: "Al-Ma'idah",
    6: "Al-An'am",
    7: "Al-A'raf",
    8: "Al-Anfal",
    9: "At-Tawbah",
    10: "Yunus",
    11: "Hud",
    12: "Yusuf",
    13: "Ar-Ra'd",
    14: "Ibrahim",
    15: "Al-Hijr",
    16: "An-Nahl",
    17: "Al-Isra",
    18: "Al-Kahf",
    19: "Maryam",
    20: "Taha",
    21: "Al-Anbya",
    22: "Al-Hajj",
    23: "Al-Mu'minun",
    24: "An-Nur",
    25: "Al-Furqan",
    26: "Ash-Shu'ara",
    27: "An-Naml",
    28: "Al-Qasas",
    29: "Al-'Ankabut",
    30: "Ar-Rum",
    31: "Luqman",
    32: "As-Sajdah",
    33: "Al-Ahzab",
    34: "Saba",
    35: "Fatir",
    36: "Ya-Sin",
    37: "As-Saffat",
    38: "Sad",
    39: "Az-Zumar",
    40: "Ghafir",
    41: "Fussilat",
    42: "Ash-Shuraa",
    43: "Az-Zukhruf",
    44: "Ad-Dukhan",
    45: "Al-Jathiyah",
    46: "Al-Ahqaf",
    47: "Muhammad",
    48: "Al-Fath",
    49: "Al-Hujurat",
    50: "Qaf",
    51: "Adh-Dhariyat",
    52: "At-Tur",
    53: "An-Najm",
    54: "Al-Qamar",
    55: "Ar-Rahman",
    56: "Al-Waqi'ah",
    57: "Al-Hadid",
    58: "Al-Mujadilah",
    59: "Al-Hashr",
    60: "Al-Mumtahanah",
    61: "As-Saf",
    62: "Al-Jumu'ah",
    63: "Al-Munafiqun",
    64: "At-Taghabun",
    65: "At-Talaq",
    66: "At-Tahrim",
    67: "Al-Mulk",
    68: "Al-Qalam",
    69: "Al-Haqqah",
    70: "Al-Ma'arij",
    71: "Nuh",
    72: "Al-Jinn",
    73: "Al-Muzzammil",
    74: "Al-Muddaththir",
    75: "Al-Qiyamah",
    76: "Al-Insan",
    77: "Al-Mursalat",
    78: "An-Naba",
    79: "An-Nazi'at",
    80: "'Abasa",
    81: "At-Takwir",
    82: "Al-Infitar",
    83: "Al-Mutaffifin",
    84: "Al-Inshiqaq",
    85: "Al-Buruj",
    86: "At-Tariq",
    87: "Al-A'la",
    88: "Al-Ghashiyah",
    89: "Al-Fajr",
    90: "Al-Balad",
    91: "Ash-Shams",
    92: "Al-Layl",
    93: "Ad-Duha",
    94: "Ash-Sharh",
    95: "At-Tin",
    96: "Al-'Alaq",
    97: "Al-Qadr",
    98: "Al-Bayyinah",
    99: "Az-Zalzalah",
    100: "Al-'Adiyat",
    101: "Al-Qari'ah",
    102: "At-Takathur",
    103: "Al-'Asr",
    104: "Al-Humazah",
    105: "Al-Fil",
    106: "Quraysh",
    107: "Al-Ma'un",
    108: "Al-Kawthar",
    109: "Al-Kafirun",
    110: "An-Nasr",
    111: "Al-Masad",
    112: "Al-Ikhlas",
    113: "Al-Falaq",
    114: "An-Nas",
}


def _get_surah_name(number: int) -> str:
    return SURAHS.get(number, f"Surah {number}")


def _normalize_qf_bookmark(raw: dict[str, Any]) -> BookmarkResponse:
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
        surah_name=_get_surah_name(surah_number),
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

    normalized = [
        _normalize_qf_bookmark(b)
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

    return BookmarkResponse(
        id=str(data.get("data", {}).get("id", "")),
        ayah_key=ayah_key,
        type="ayah",
        surah_number=surah_number,
        surah_name=_get_surah_name(surah_number),
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
