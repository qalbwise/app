from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth.router import get_current_user
from app.api.notes.serializer import (
    NoteCreate,
    NoteListResponse,
    NoteResponse,
)
from app.core.database import get_db
from app.models.user import User
from app.modules.notes import service

router = APIRouter(prefix="/notes", tags=["notes"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=NoteResponse)
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


@router.get("", response_model=NoteListResponse)
async def get_notes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notes = await service.get_notes(db, current_user.id)
    return NoteListResponse(
        notes=[
            NoteResponse(
                id=n.id,
                topic=n.topic,
                content=n.content,
                verses=n.verses,
                created_at=n.created_at,
                updated_at=n.updated_at,
            )
            for n in notes
        ]
    )


@router.patch("/{note_id}", response_model=NoteResponse)
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


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
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
