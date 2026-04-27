from app.api.users.serializer import UserPreferences

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
