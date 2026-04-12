from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security.jwt import (
    create_access_token,
    create_refresh_token,
    verify_token,
)
from app.core.security.password import hash_password, verify_password
from app.models.user import User


async def register(
    db: AsyncSession, email: str, full_name: str, password: str
) -> User | None:
    result = await db.exec(select(User).where(User.email == email))
    if result.one_or_none():
        return None

    hashed = hash_password(password)
    user = User(email=email, full_name=full_name, hashed_password=hashed)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def login(db: AsyncSession, email: str, password: str) -> tuple[str, str] | None:
    result = await db.exec(select(User).where(User.email == email))
    user = result.one_or_none()

    if not user or not verify_password(password, user.hashed_password):
        return None

    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    return access, refresh


async def refresh(db: AsyncSession, token: str) -> tuple[str, str] | None:
    user_id = verify_token(token)
    if not user_id:
        return None

    result = await db.exec(select(User).where(User.id == user_id))
    user = result.one_or_none()

    if not user:
        return None

    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    return access, refresh
