from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth.serializer import (
    GoogleLoginRequest,
    RefreshRequest,
    TokenResponse,
    UserResponse,
)
from app.core.database import get_db
from app.core.security.jwt import verify_token
from app.models.user import User
from app.modules.auth import service

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()
limiter = Limiter(key_func=get_remote_address)


class GoogleAccessTokenRequest(BaseModel):
    access_token: str


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/15minutes")
async def login(
    req: GoogleLoginRequest, request: Request, db: AsyncSession = Depends(get_db)
):
    tokens = await service.login_google(db, req.id_token)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )
    access, refresh = tokens
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/login/access-token", response_model=TokenResponse)
@limiter.limit("5/15minutes")
async def login_with_access_token(
    req: GoogleAccessTokenRequest, request: Request, db: AsyncSession = Depends(get_db)
):
    tokens = await service.login_google_access_token(db, req.access_token)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google access token",
        )
    access, refresh = tokens
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("5/15minutes")
async def refresh(
    req: RefreshRequest, request: Request, db: AsyncSession = Depends(get_db)
):
    tokens = await service.refresh(db, req.refresh_token)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    access, refresh = tokens
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
