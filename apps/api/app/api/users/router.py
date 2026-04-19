from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth.router import get_current_user
from app.api.users.serializer import UserPreferences, UserPreferencesUpdate
from app.core.database import get_db
from app.models.user import User
from app.modules.users import service as users_service

router = APIRouter(prefix="/users", tags=["users"])


@router.put("/me/preferences", response_model=UserPreferences)
async def put_my_preferences(
    body: UserPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await users_service.update_preferences(db, current_user, body)
