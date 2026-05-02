import asyncio

from sqlalchemy import select

from app.core.database import async_session_maker
from app.models.search import Topic
from app.modules.search.service import create_search, normalize_query
from app.modules.search.tasks import run_search

COMMON_TOPICS = (
    "grief",
    "anxiety",
    "fear",
    "gratitude",
    "patience",
    "loss",
    "hope",
    "loneliness",
    "anger",
    "forgiveness",
    "hardship",
    "trust",
    "jealousy",
    "pride",
    "regret",
    "love",
    "uncertainty",
    "depression",
    "success",
    "death",
)


async def main() -> None:
    async with async_session_maker() as db:
        for topic_name in COMMON_TOPICS:
            result = await db.execute(
                select(Topic).where(
                    Topic.canonical_query == normalize_query(topic_name)
                )
            )
            topic = result.scalar_one_or_none()
            if topic:
                if topic.status != "complete":
                    print(f"Enqueuing '{topic_name}' (current: {topic.status})")
                    run_search.delay(str(topic.id))
            else:
                print(f"Creating and enqueuing new topic: {topic_name}")
                await create_search(db, topic_name)


if __name__ == "__main__":
    asyncio.run(main())
