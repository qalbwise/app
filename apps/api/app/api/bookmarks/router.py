from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth.router import get_current_user
from app.api.bookmarks.serializer import (
    BookmarkCreate,
    BookmarkListResponse,
    BookmarkResponse,
    NoteCreate,
    NoteListResponse,
    NoteResponse,
)
from app.core.database import get_db
from app.models.user import User
from app.modules.bookmarks import service

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=BookmarkResponse)
async def create_bookmark(
    body: BookmarkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bookmark = await service.create_bookmark(
        db,
        user_id=current_user.id,
        ayah_key=body.ayah_key,
        surah_name=body.surah_name,
        arabic_text=body.arabic_text,
        translation=body.translation,
        note=body.note,
        extra_data=body.extra_data,
    )
    return bookmark


@router.get("", response_model=BookmarkListResponse)
async def get_bookmarks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bookmarks = await service.get_bookmarks(db, current_user.id)
    return BookmarkListResponse(
        bookmarks=[
            BookmarkResponse(
                id=b.id,
                user_id=b.user_id,
                ayah_key=b.ayah_key,
                surah_name=b.surah_name,
                arabic_text=b.arabic_text,
                translation=b.translation,
                note=b.note,
                extra_data=b.extra_data,
                created_at=b.created_at,
            )
            for b in bookmarks
        ]
    )


@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bookmark(
    bookmark_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success = await service.delete_bookmark(db, UUID(bookmark_id), current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found",
        )


@router.post("/notes", status_code=status.HTTP_201_CREATED, response_model=NoteResponse)
async def create_note(
    body: NoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = await service.create_note(
        db,
        user_id=current_user.id,
        topic=body.topic,
        content=body.content,
        verses=body.verses,
    )
    return note


@router.get("/notes", response_model=NoteListResponse)
async def get_notes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notes = await service.get_notes(db, current_user.id)
    return NoteListResponse(
        notes=[
            NoteResponse(
                id=n.id,
                user_id=n.user_id,
                topic=n.topic,
                content=n.content,
                verses=n.verses,
                created_at=n.created_at,
                updated_at=n.updated_at,
            )
            for n in notes
        ]
    )


@router.patch("/notes/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    content: str = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = await service.update_note(
        db, UUID(note_id), current_user.id, content=content
    )
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )
    return note


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success = await service.delete_note(db, UUID(note_id), current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )
