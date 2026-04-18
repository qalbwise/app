from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth.serializer import UserResponse
from app.api.users.serializer import UserPreferences, UserPreferencesUpdate
from app.models.user import User

_VALID_ARABIC_FONTS = frozenset({"hafs_quran", "indopak"})
_LEGACY_ARABIC_FONT = {
    "scheherazade": "hafs_quran",
    "amiri": "hafs_quran",
    "droid_arabic_naskh": "hafs_quran",
}


def _normalize_preferences_dict(raw: dict) -> dict:
    data = dict(raw)
    af = data.get("arabic_font")
    if isinstance(af, str) and af not in _VALID_ARABIC_FONTS:
        data["arabic_font"] = _LEGACY_ARABIC_FONT.get(af, "hafs_quran")
    return data


def preferences_from_row(raw: dict | None) -> UserPreferences:
    if not raw:
        return UserPreferences()
    try:
        return UserPreferences.model_validate(_normalize_preferences_dict(raw))
    except Exception:
        return UserPreferences()


def build_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        created_at=user.created_at,
        preferences=preferences_from_row(user.preferences),
    )


async def update_preferences(
    db: AsyncSession, user: User, data: UserPreferencesUpdate
) -> UserPreferences:
    merged = UserPreferences(
        serif=data.serif,
        arabic_font=data.arabic_font,
    )
    user.preferences = merged.model_dump()
    await db.commit()
    await db.refresh(user)
    return preferences_from_row(user.preferences)
