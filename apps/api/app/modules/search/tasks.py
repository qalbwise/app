import json
import re as _re

from celery import Task
from loguru import logger

from app.core.celery import celery_app
from app.models.search import Search
from app.models.user import User  # noqa: F401


class CallbackTask(Task):
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        pass


async def get_qf_mcp_results_async(query: str) -> dict:
    from mcp.client.streamable_http import streamable_http_client

    mcp_server_url = "https://mcp.quran.ai/"

    async with streamable_http_client(mcp_server_url) as (read, write, _):
        from mcp.client.session import ClientSession

        async with ClientSession(read, write) as session:
            await session.initialize()

            result = await session.call_tool(
                "search_quran",
                arguments={"query": query, "translations": "en"},
            )

            text_content = ""
            if result.content:
                for content in result.content:
                    if content.type == "text":
                        text_content = content.text
                        break

            try:
                data = json.loads(text_content)
                return data
            except Exception:
                return {"results": []}


def _strip_html(text: str) -> str:
    """Remove HTML tags and decode common entities from translation strings."""
    text = _re.sub(r"<[^>]+>", "", text)
    text = (
        text.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&nbsp;", " ")
    )
    return text.strip()


def parse_mcp_results(raw: dict) -> list[dict]:
    results = raw.get("results", [])
    parsed = []

    for item in results:
        ayah_key = item.get("ayah_key", "")
        translations = item.get("translations", [])

        surah_name = ""
        if ":" in ayah_key:
            surah_num = ayah_key.split(":")[0]
            surah_name = f"Surah {surah_num}"

        raw_translation = translations[0].get("text", "") if translations else ""

        parsed.append(
            {
                "ayah_key": ayah_key,
                "surah_name": surah_name,
                "arabic_text": item.get("text", ""),
                "translation": _strip_html(raw_translation),
                "translator": (
                    translations[0].get("edition", {}).get("author", "")
                    if translations
                    else ""
                ),
                "relevance_score": item.get("relevance_score", 0.0),
                "url": item.get("url", ""),
            }
        )

    return parsed


async def rank_with_openai_async(topic: str, verses: list[dict]) -> list[dict]:
    if not verses:
        return []

    verses_text = "\n\n".join(
        f"Verse {i + 1} ({v.get('ayah_key', '')}): {v.get('arabic_text', '')}\n"
        f"Translation: {v.get('translation', '')}"
        for i, v in enumerate(verses[:20])
    )

    prompt = f"""Given the user's topic: "{topic}"

Here are the top relevant verses from the Quran:
{verses_text}

Rank the top 3-5 verses that best relate to this topic.
For each verse, provide the index (1-based) and a one-sentence explanation.

Respond in JSON format only, with no extra text:
[{{"index": 1, "why_this_verse": "..."}}, {{"index": 3, "why_this_verse": "..."}}]"""

    from app.core.settings import get_settings

    settings = get_settings()

    from openai import AsyncOpenAI

    client = AsyncOpenAI(
        base_url=settings.OPENAI_BASE_URL, api_key=settings.OPENAI_API_KEY
    )

    response = await client.chat.completions.create(
        model="nvidia/nemotron-3-super-120b-a12b:free",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
        extra_body={"models": ["z-ai/glm-4.5-air:free", "openai/gpt-oss-120b:free"]},
    )

    content = response.choices[0].message.content or ""
    content = content.strip()
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
        content = content.strip()

    try:
        rankings = json.loads(content)
    except Exception:
        logger.info(f"Failed to parse JSON, raw content: {content}")
        rankings = []

    index_map = {r["index"]: r["why_this_verse"] for r in rankings}

    ranked = []
    for i, verse in enumerate(verses):
        verse_copy = verse.copy()
        if i == 0 and index_map.get(1):
            verse_copy["why_this_verse"] = index_map.get(1)
        verse_copy["rank"] = i
        ranked.append(verse_copy)

    return ranked[:5]


async def get_verse_explanation_async(topic: str, verse: dict) -> str:
    if not verse:
        return ""

    ayah_key = verse.get("ayah_key", "")
    arabic_text = verse.get("arabic_text", "")
    translation = verse.get("translation", "")
    verses_text = f"Verse ({ayah_key}): {arabic_text}\nTranslation: {translation}"

    prompt = f"""Given the user's topic: "{topic}"
    Here is a verse from the Quran:
    {verses_text}

    Provide a one-sentence explanation of why this verse relates to the user's topic.
    Respond in one sentence only, no extra text.
    """

    from app.core.settings import get_settings

    settings = get_settings()

    from openai import AsyncOpenAI

    client = AsyncOpenAI(
        base_url=settings.OPENAI_BASE_URL, api_key=settings.OPENAI_API_KEY
    )

    response = await client.chat.completions.create(
        model="nvidia/nemotron-3-super-120b-a12b:free",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200,
        extra_body={"models": ["z-ai/glm-4.5-air:free", "openai/gpt-oss-120b:free"]},
    )

    content = response.choices[0].message.content or ""
    return content.strip()


@celery_app.task(bind=True, base=CallbackTask)
def run_search(self, search_id: str):
    async def process():
        from sqlalchemy import select
        from sqlalchemy.ext.asyncio import (
            AsyncSession,
            async_sessionmaker,
            create_async_engine,
        )

        from app.core.settings import get_settings as _get_settings

        # Create a fresh engine + session per task to avoid asyncio loop conflicts
        # in Celery's prefork workers (each fork gets its own event loop).
        _settings = _get_settings()
        _engine = create_async_engine(_settings.DATABASE_URL, echo=False)
        _session_maker = async_sessionmaker(
            _engine, class_=AsyncSession, expire_on_commit=False
        )

        async with _session_maker() as db:
            result = await db.execute(select(Search).where(Search.id == search_id))
            search = result.scalar_one_or_none()

            if not search:
                return

            search.status = "processing"
            search.step = "searching_quran"
            await db.commit()

            try:
                raw = await get_qf_mcp_results_async(search.topic)
                search.raw_results = raw
                search.step = "ranking"
                await db.commit()

                parsed = parse_mcp_results(raw)

                if parsed:
                    ranked = await rank_with_openai_async(search.topic, parsed)
                    search.results = ranked
                else:
                    search.results = []

                search.status = "complete"
                search.step = None
                await db.commit()

            except Exception as e:
                logger.exception(f"Search task failed: {e}")
                search.status = "failed"
                search.step = f"error: {str(e)}"
                await db.commit()

        await _engine.dispose()

    import asyncio

    asyncio.run(process())
