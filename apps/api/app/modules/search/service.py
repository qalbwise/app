import uuid
from dataclasses import dataclass

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.search import Topic, UserSearch
from app.modules.search.tasks import run_search
from app.modules.search.utils import (
    FORBIDDEN_SEARCH_WORDS,
    is_leet_speak_variant,
    normalize_query,
    slugify_query,
)


@dataclass(frozen=True)
class CreateSearchResult:
    topic: Topic
    cached: bool


async def ensure_unique_slug(db: AsyncSession, canonical_query: str) -> str:
    base_slug = slugify_query(canonical_query)
    slug = base_slug
    suffix = 2

    while True:
        result = await db.execute(select(Topic.id).where(Topic.slug == slug))
        if result.scalar_one_or_none() is None:
            return slug
        suffix_text = f"-{suffix}"
        slug = f"{base_slug[: 80 - len(suffix_text)]}{suffix_text}"
        suffix += 1


async def validate_search_input(topic: str) -> None:
    topic_lower = topic.lower().strip()
    words = topic_lower.split()
    error_detail = "Search contains inappropriate language. Please try another topic."

    for word in words:
        if word in FORBIDDEN_SEARCH_WORDS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=error_detail
            )

        for forbidden_word in FORBIDDEN_SEARCH_WORDS:
            if is_leet_speak_variant(word, forbidden_word):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, detail=error_detail
                )


async def create_search(
    db: AsyncSession,
    topic: str,
    user_id: str | None = None,
    session_id: str | None = None,
) -> CreateSearchResult:
    await validate_search_input(topic)

    canonical_query = normalize_query(topic)
    if not canonical_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Search topic is required."
        )

    result = await db.execute(
        select(Topic).where(Topic.canonical_query == canonical_query)
    )
    existing_topic = result.scalar_one_or_none()
    user_uuid = uuid.UUID(user_id) if user_id else None
    if existing_topic:
        existing_topic.search_count += 1
        db.add(
            UserSearch(
                user_id=user_uuid,
                session_id=session_id,
                topic_id=existing_topic.id,
                user_query=topic,
            )
        )
        await db.commit()
        await db.refresh(existing_topic)
        return CreateSearchResult(topic=existing_topic, cached=True)

    # 3. Cache miss
    slug = await ensure_unique_slug(db, canonical_query)
    new_topic = Topic(
        slug=slug,
        canonical_query=canonical_query,
        search_count=1,
        status="pending",
    )
    db.add(new_topic)
    await db.flush()
    db.add(
        UserSearch(
            user_id=user_uuid,
            session_id=session_id,
            topic_id=new_topic.id,
            user_query=topic,
        )
    )
    await db.commit()
    await db.refresh(new_topic)

    run_search.delay(str(new_topic.id))

    return CreateSearchResult(topic=new_topic, cached=False)


async def get_topic_by_slug(
    db: AsyncSession, slug: str, *, include_results: bool = False
) -> Topic | None:
    stmt = select(Topic).where(Topic.slug == slug)
    if include_results:
        stmt = stmt.options(selectinload(Topic.results))
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def list_searches(
    db: AsyncSession, user_id: str | None = None, session_id: str | None = None
) -> list[Topic]:
    stmt = (
        select(Topic)
        .join(UserSearch)
        .options(selectinload(Topic.results))
        .order_by(UserSearch.created_at.desc())
    )
    if user_id:
        stmt = stmt.where(UserSearch.user_id == uuid.UUID(user_id))
    elif session_id:
        stmt = stmt.where(UserSearch.session_id == session_id)
    else:
        return []

    result = await db.execute(stmt)
    return list(result.scalars().unique().all())
