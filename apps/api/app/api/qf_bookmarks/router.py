from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth.router import get_current_user
from app.api.qf_bookmarks.serializer import (
    QfBookmarkCreate,
    QfBookmarkListResponse,
    QfBookmarkResponse,
)
from app.core.database import get_db
from app.models.user import User
from app.modules.qf_bookmarks import service

router = APIRouter(prefix="/qf-bookmarks", tags=["qf-bookmarks"])

CurrentUserDep = Annotated[User, Depends(get_current_user)]
DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=QfBookmarkListResponse)
async def get_qf_bookmarks(
    db: DbDep,
    current_user: CurrentUserDep,
) -> QfBookmarkListResponse:
    bookmarks = await service.list_qf_bookmarks(db, current_user)
    return QfBookmarkListResponse(bookmarks=bookmarks)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=QfBookmarkResponse,
)
async def create_qf_bookmark(
    body: QfBookmarkCreate,
    db: DbDep,
    current_user: CurrentUserDep,
) -> QfBookmarkResponse:
    return await service.create_qf_bookmark(db, current_user, body.ayah_key)


@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_qf_bookmark(
    bookmark_id: str,
    db: DbDep,
    current_user: CurrentUserDep,
) -> None:
    await service.delete_qf_bookmark(db, current_user, bookmark_id)
