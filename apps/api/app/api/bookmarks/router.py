from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth.router import get_current_user
from app.api.bookmarks.serializer import (
    BookmarkCreate,
    BookmarkListResponse,
    BookmarkResponse,
)
from app.core.database import get_db
from app.models.user import User
from app.modules.bookmarks import service

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])

CurrentUserDep = Annotated[User, Depends(get_current_user)]
DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=BookmarkListResponse)
async def get_bookmarks(
    db: DbDep,
    current_user: CurrentUserDep,
) -> BookmarkListResponse:
    bookmarks = await service.list_bookmarks(db, current_user)
    return BookmarkListResponse(bookmarks=bookmarks)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=BookmarkResponse,
)
async def create_bookmark(
    body: BookmarkCreate,
    db: DbDep,
    current_user: CurrentUserDep,
) -> BookmarkResponse:
    return await service.create_bookmark(db, current_user, body.ayah_key)


@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bookmark(
    bookmark_id: str,
    db: DbDep,
    current_user: CurrentUserDep,
) -> None:
    await service.delete_bookmark(db, current_user, bookmark_id)
