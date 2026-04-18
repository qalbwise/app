import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.search.serializer import (
    SearchCreate,
    SearchListResponse,
    SearchResponse,
    VerseExplainResponse,
    VerseResult,
)
from app.core.database import get_db
from app.models.search import Search
from app.models.user import User
from app.modules.search import service

router = APIRouter(prefix="/search", tags=["search"])
limiter = Limiter(key_func=get_remote_address)


async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User | None:
    from app.core.security.jwt import verify_token

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ")[1]
    user_id = verify_token(token)
    if not user_id:
        return None

    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


@router.post("", status_code=status.HTTP_201_CREATED)
@limiter.limit("20/hour")
async def create_search(
    body: SearchCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
    request: Request = None,
):
    session_id = None
    if request:
        session_id = request.cookies.get("session_id")

    search = await service.create_search(
        db, body.topic, str(current_user.id) if current_user else None, session_id
    )

    return {"slug": search.slug}


@router.get("/{slug}", response_model=SearchResponse)
async def get_search(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    search = await service.get_search_by_slug(db, slug)
    if not search:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Search not found",
        )

    results = None
    if search.results:
        results = [VerseResult(**r) for r in search.results]

    return SearchResponse(
        id=search.id,
        slug=search.slug,
        topic=search.topic,
        status=search.status,
        step=search.step,
        results=results,
        created_at=search.created_at,
    )


@router.get("/{slug}/stream")
async def stream_search(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    search = await service.get_search_by_slug(db, slug)
    if not search:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Search not found",
        )

    async def event_generator():
        last_signature: tuple[str, str | None, str | None] | None = None
        while True:
            # Expire session cache so every iteration hits the DB fresh
            await db.execute(select(1))
            db.expire_all()

            result = await db.execute(select(Search).where(Search.slug == slug))
            search = result.scalar_one_or_none()

            if not search:
                break

            results_fingerprint: str | None = None
            if search.results:
                results_fingerprint = json.dumps(
                    search.results, ensure_ascii=False, sort_keys=True
                )

            signature = (search.status, search.step, results_fingerprint)
            if signature != last_signature:
                last_signature = signature
                event_data = {
                    "status": search.status,
                    "step": search.step,
                }
                if search.results:
                    event_data["results"] = search.results

                yield f"data: {json.dumps(event_data)}\n\n"

            if search.status in ("complete", "failed"):
                break

            await asyncio.sleep(1)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{slug}/explain/{ayah_key}", response_model=VerseExplainResponse)
async def explain_verse(
    slug: str,
    ayah_key: str,
    db: AsyncSession = Depends(get_db),
):
    from app.modules.search import tasks

    search = await service.get_search_by_slug(db, slug)
    if not search:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Search not found",
        )

    if not search.results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No results found",
        )

    verse_data = None
    for v in search.results:
        if v.get("ayah_key") == ayah_key:
            verse_data = v
            break

    if not verse_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verse not found in results",
        )

    topic = search.topic
    why_this_verse = await tasks.get_verse_explanation_async(topic, verse_data)

    return VerseExplainResponse(
        ayah_key=ayah_key,
        why_this_verse=why_this_verse,
    )


async def list_searches(
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
    request: Request = None,
):
    session_id = None
    if request:
        session_id = request.cookies.get("session_id")

    searches = await service.list_searches(
        db, str(current_user.id) if current_user else None, session_id
    )

    return SearchListResponse(
        searches=[
            SearchResponse(
                id=s.id,
                slug=s.slug,
                topic=s.topic,
                status=s.status,
                step=s.step,
                results=None,
                created_at=s.created_at,
            )
            for s in searches
        ]
    )
