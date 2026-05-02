import asyncio
import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.search.serializer import (
    SearchCreate,
    SearchCreateResponse,
    SearchListResponse,
    SearchResponse,
    VersePageResponse,
    VerseResult,
)
from app.core.database import get_db
from app.models.search import Topic, TopicResult
from app.models.user import User
from app.modules.search import service
from app.modules.search.utils import serialize_result, serialize_results
from app.modules.tafsir.service import get_or_fetch_tafsir

router = APIRouter(prefix="/search", tags=["search"])
limiter = Limiter(key_func=get_remote_address)

DbDep = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user_optional(
    request: Request,
    db: DbDep,
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


CurrentUserOptionalDep = Annotated[User | None, Depends(get_current_user_optional)]


def topic_to_response(topic: Topic, *, include_results: bool = True) -> SearchResponse:
    results = None
    if include_results:
        results = [VerseResult(**r) for r in serialize_results(topic.results)]

    return SearchResponse(
        id=topic.id,
        slug=topic.slug,
        topic=topic.canonical_query,
        status=topic.status,
        step=topic.step,
        search_count=topic.search_count,
        results=results,
        created_at=topic.created_at,
    )


@router.post("", status_code=status.HTTP_201_CREATED)
@limiter.limit("20/hour")
async def create_search(
    body: SearchCreate,
    db: DbDep,
    current_user: CurrentUserOptionalDep,
    request: Request,
) -> SearchCreateResponse:
    session_id = request.cookies.get("session_id")

    created = await service.create_search(
        db, body.topic, str(current_user.id) if current_user else None, session_id
    )

    return SearchCreateResponse(slug=created.topic.slug, cached=created.cached)


@router.get("/{slug}")
async def get_search(slug: str, db: DbDep) -> SearchResponse:
    topic = await service.get_topic_by_slug(db, slug, include_results=True)
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Search not found",
        )

    return topic_to_response(topic)


@router.get("/{slug}/stream")
async def stream_search(slug: str, db: DbDep) -> StreamingResponse:
    topic = await service.get_topic_by_slug(db, slug)
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Search not found",
        )

    async def event_generator():
        last_signature: tuple[str, str | None, str | None] | None = None
        while True:
            await db.execute(select(1))
            db.expire_all()

            result = await db.execute(
                select(Topic)
                .where(Topic.slug == slug)
                .options(selectinload(Topic.results))
            )
            current_topic = result.scalar_one_or_none()

            if not current_topic:
                break

            serialized_results = serialize_results(current_topic.results)
            results_fingerprint = None
            if serialized_results:
                results_fingerprint = json.dumps(
                    serialized_results, ensure_ascii=False, sort_keys=True
                )

            signature = (
                current_topic.status,
                current_topic.step,
                results_fingerprint,
            )
            if signature != last_signature:
                last_signature = signature
                event_data = {
                    "status": current_topic.status,
                    "step": current_topic.step,
                }
                if serialized_results:
                    event_data["results"] = serialized_results

                yield f"data: {json.dumps(event_data)}\n\n"

            if current_topic.status in ("complete", "failed"):
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


@router.get("/{slug}/verse/{page}")
async def get_verse_page(slug: str, page: int, db: DbDep) -> VersePageResponse:
    topic = await service.get_topic_by_slug(db, slug)
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Search not found",
        )

    result = await db.execute(
        select(TopicResult)
        .where(TopicResult.topic_id == topic.id)
        .order_by(TopicResult.rank)
    )
    results = list(result.scalars().all())
    if page < 1 or page > len(results):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verse page not found",
        )

    topic_result = await get_or_fetch_tafsir(db, results[page - 1])

    return VersePageResponse(
        page=page,
        total_pages=len(results),
        verse=VerseResult(**serialize_result(topic_result)),
    )


@router.get("")
async def list_searches(
    db: DbDep,
    current_user: CurrentUserOptionalDep,
    request: Request,
) -> SearchListResponse:
    session_id = request.cookies.get("session_id")

    topics = await service.list_searches(
        db, str(current_user.id) if current_user else None, session_id
    )

    return SearchListResponse(
        searches=[topic_to_response(topic, include_results=False) for topic in topics]
    )


@router.get("/{slug}/verse/{page}/explain")
async def explain_verse(
    slug: str,
    page: int,
    db: DbDep,
) -> dict:
    topic = await service.get_topic_by_slug(db, slug)
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Search not found",
        )

    result = await db.execute(
        select(TopicResult)
        .where(TopicResult.topic_id == topic.id)
        .order_by(TopicResult.rank)
    )
    results = list(result.scalars().all())
    if page < 1 or page > len(results):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verse page not found",
        )

    topic_result = results[page - 1]

    if topic_result.why_this_verse:
        return {"why_this_verse": topic_result.why_this_verse}

    from app.modules.search.tasks import get_verse_explanation_async

    explanation = await get_verse_explanation_async(
        topic.canonical_query,
        {
            "ayah_key": topic_result.ayah_key,
            "arabic_text": topic_result.arabic_text,
            "translation": topic_result.translation,
        },
    )

    if explanation:
        topic_result.why_this_verse = explanation
        await db.commit()

    return {"why_this_verse": explanation}
