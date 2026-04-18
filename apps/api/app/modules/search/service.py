import secrets
import string
from typing import Any

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.search import Search
from app.modules.search.tasks import run_search
from app.modules.search.utils import FORBIDDEN_SEARCH_WORDS, is_leet_speak_variant


def generate_slug() -> str:
    chars = string.ascii_lowercase + string.digits
    return "srch_" + "".join(secrets.choice(chars) for _ in range(8))


async def validate_search_input(topic: str) -> None:
    topic_lower = topic.lower().strip()
    words = topic_lower.split()
    error_detail = "Search contains inappropriate language. Please try another topic."

    for word in words:
        if word in FORBIDDEN_SEARCH_WORDS:
            raise HTTPException(status_code=400, detail=error_detail)

        for forbidden_word in FORBIDDEN_SEARCH_WORDS:
            if is_leet_speak_variant(word, forbidden_word):
                raise HTTPException(status_code=400, detail=error_detail)


async def create_search(
    db: AsyncSession,
    topic: str,
    user_id: str | None = None,
    session_id: str | None = None,
) -> Search:
    await validate_search_input(topic)

    slug = generate_slug()
    search = Search(
        slug=slug,
        topic=topic,
        status="pending",
        user_id=user_id,
        session_id=session_id,
    )
    db.add(search)
    await db.commit()
    await db.refresh(search)

    run_search.delay(str(search.id))

    return search


async def get_search_by_slug(db: AsyncSession, slug: str) -> Search | None:
    result = await db.execute(select(Search).where(Search.slug == slug))
    return result.scalar_one_or_none()


async def list_searches(
    db: AsyncSession, user_id: str | None = None, session_id: str | None = None
) -> list[Search]:
    if user_id:
        result = await db.execute(
            select(Search)
            .where(Search.user_id == user_id)
            .order_by(Search.created_at.desc())
        )
    elif session_id:
        result = await db.execute(
            select(Search)
            .where(Search.session_id == session_id)
            .order_by(Search.created_at.desc())
        )
    else:
        return []

    return list(result.scalars().all())


def serialize_results(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "ayah_key": r.get("ayah_key", ""),
            "surah_name": r.get("surah_name", ""),
            "arabic_text": r.get("arabic_text", ""),
            "translation": r.get("translation", ""),
            "translator": r.get("translator", ""),
            "relevance_score": r.get("relevance_score", 0.0),
            "url": r.get("url", ""),
            "why_this_verse": r.get("why_this_verse"),
        }
        for r in results
    ]
