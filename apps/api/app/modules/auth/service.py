import requests
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security.jwt import (
    create_access_token,
    create_refresh_token,
    verify_token,
)
from app.core.settings import get_settings
from app.models.user import User


async def login_google(db: AsyncSession, id_token_str: str) -> tuple[str, str] | None:
    settings = get_settings()
    if not settings.GOOGLE_CLIENT_ID:
        return None

    try:
        import google.auth.transport.requests

        request = google.auth.transport.requests.Request()
        from google.oauth2 import id_token

        id_info = id_token.verify_oauth2_token(
            id_token_str, request, settings.GOOGLE_CLIENT_ID
        )
    except Exception:
        return None

    email = id_info.get("email")
    full_name = id_info.get("name", "")

    if not email:
        return None

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(email=email, full_name=full_name)
        db.add(user)
        await db.commit()
        await db.refresh(user)

    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    return access, refresh


async def login_google_access_token(
    db: AsyncSession, access_token: str
) -> tuple[str, str] | None:
    settings = get_settings()
    if not settings.GOOGLE_CLIENT_ID:
        return None

    try:
        response = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        if response.status_code != 200:
            return None

        user_info = response.json()
    except Exception:
        return None

    email = user_info.get("email")
    full_name = user_info.get("name", "")

    if not email:
        return None

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(email=email, full_name=full_name)
        db.add(user)
        await db.commit()
        await db.refresh(user)

    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    return access, refresh


async def refresh(db: AsyncSession, token: str) -> tuple[str, str] | None:
    user_id = verify_token(token)
    if not user_id:
        return None

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        return None

    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    return access, refresh
