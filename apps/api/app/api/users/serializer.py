from typing import Literal

from pydantic import BaseModel, Field

ArabicFontId = Literal["hafs_quran", "indopak"]


class UserPreferences(BaseModel):
    serif: bool = Field(
        default=False,
        description="Use serif stack for Latin/UI body text",
    )
    arabic_font: ArabicFontId = Field(default="hafs_quran")


class UserPreferencesUpdate(BaseModel):
    serif: bool
    arabic_font: ArabicFontId
