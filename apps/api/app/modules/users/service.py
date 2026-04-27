from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth.serializer import UserResponse
from app.api.users.serializer import UserPreferences, UserPreferencesUpdate
from app.models.user import User
from app.modules.users.utils import preferences_from_row


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
