from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.api.users.serializer import UserPreferences


class GoogleLoginRequest(BaseModel):
    id_token: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    is_active: bool
    created_at: datetime
    preferences: UserPreferences

    model_config = {"from_attributes": True}
