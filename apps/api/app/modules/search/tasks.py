import asyncio
import json
import re
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from celery import Task
from loguru import logger
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client
from openai import AsyncOpenAI
from sqlalchemy import delete, select

from app.core.celery import celery_app
from app.core.settings import get_settings
from app.models.search import Topic, TopicResult
from app.modules.llm.prompts import append_english_only
from app.modules.quran_mcp import MCP_SERVER_URL, make_mcp_http_client


class CallbackTask(Task):
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        pass


def normalize_ayah_key(key: str) -> str:
    key = (key or "").strip()
    if ":" not in key:
        return key
    left, right = key.split(":", 1)
    try:
        return f"{int(left)}:{int(right)}"
    except ValueError:
        return key


def quran_com_en_url(ayah_key: str) -> str:
    key = normalize_ayah_key(ayah_key)
    if ":" not in key:
        return "https://quran.com/en"
    surah, ayah = key.split(":", 1)
    return f"https://quran.com/en/{surah}/{ayah}"


def extract_text_content(result: Any) -> dict:
    text_content = ""
    for content in result.content or []:
        if content.type == "text":
            text_content = content.text
            break

    try:
        return json.loads(text_content)
    except Exception:
        return {}


def strip_sup_tags(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"<sup[^>]*>\d+</sup>", "", text)
    return text


def extract_translation(item: dict) -> str:
    translations = item.get("translations") or []
    if isinstance(translations, dict):
        translations = list(translations.values())

    for translation in translations:
        if isinstance(translation, str):
            return strip_sup_tags(translation)
        if not isinstance(translation, dict):
            continue
        text = translation.get("text") or translation.get("translation")
        if isinstance(text, str) and text.strip():
            return strip_sup_tags(text.strip())

    text = item.get("translation") or item.get("translated_text")
    return strip_sup_tags(text.strip()) if isinstance(text, str) else ""


def parse_mcp_results(raw: dict) -> list[dict]:
    parsed: list[dict] = []
    for item in raw.get("results") or []:
        if not isinstance(item, dict):
            continue
        ayah_key = normalize_ayah_key(str(item.get("ayah_key", "")))
        if not ayah_key:
            continue
        parsed.append(
            {
                "ayah_key": ayah_key,
                "arabic_text": item.get("text") or item.get("arabic_text") or "",
                "translation": extract_translation(item),
                "relevance_score": float(item.get("relevance_score") or 0.0),
                "url": quran_com_en_url(ayah_key),
            }
        )
    return parsed


def select_top_verses(
    results: list[dict], max_n: int = 5, min_score: float = 0.52
) -> list[dict]:
    filtered = [r for r in results if r.get("relevance_score", 0.0) >= min_score]
    return (filtered or results)[:max_n]


async def fetch_verse_arabic_with_tashkeel(
    session: ClientSession, ayah_key: str
) -> str:
    try:
        result = await session.call_tool(
            "fetch_quran",
            arguments={"ayahs": ayah_key, "editions": "ar-simple"},
        )
        data = extract_text_content(result)
        results = data.get("results", {})
        if isinstance(results, dict):
            for edition, verses in results.items():
                if isinstance(verses, list) and verses:
                    text = verses[0].get("text", "")
                    if text:
                        return text
        return ""
    except Exception as exc:
        logger.debug("Failed to fetch Arabic text for {}: {}", ayah_key, exc)
        return ""


def find_first_string(data: Any, keys: set[str]) -> str | None:
    if isinstance(data, dict):
        for key, value in data.items():
            if key in keys and isinstance(value, str) and value.strip():
                return value.strip()
        for value in data.values():
            found = find_first_string(value, keys)
            if found:
                return found
    elif isinstance(data, list):
        for value in data:
            found = find_first_string(value, keys)
            if found:
                return found
    return None


def extract_surah_transliteration(data: dict, surah_num: int) -> str:
    name = find_first_string(
        data,
        {
            "transliteration",
            "transliterated_name",
            "name_simple",
            "englishName",
            "english_name",
            "latin",
        },
    )
    return name or f"Surah {surah_num}"


async def get_verse_explanation_async(topic: str, verse: dict) -> str:
    if not verse:
        return ""

    settings = get_settings()
    client = AsyncOpenAI(
        base_url=settings.OPENAI_BASE_URL,
        api_key=settings.OPENAI_API_KEY,
    )

    prompt = f"""The user is looking for Quranic guidance on: "{topic}"

Verse ({verse.get("ayah_key", "")}): {verse.get("arabic_text", "")}
Translation: {verse.get("translation", "")}

In one sentence, explain why this verse is relevant to the user's topic.
Respond in English only. Do not claim this is a religious ruling."""

    prompt = append_english_only(prompt)

    try:
        response = await client.chat.completions.create(
            model="nvidia/nemotron-3-super-120b-a12b:free",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            extra_body={
                "models": ["z-ai/glm-4.5-air:free", "openai/gpt-oss-120b:free"]
            },
        )
    except Exception as exc:
        logger.warning("OpenAI verse explanation failed: {}", exc)
        return ""

    return (response.choices[0].message.content or "").strip()


@celery_app.task(bind=True, base=CallbackTask)
def run_search(self, topic_id: str):
    async def process():
        from sqlalchemy.ext.asyncio import (
            AsyncSession,
            async_sessionmaker,
            create_async_engine,
        )

        settings = get_settings()
        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        session_maker = async_sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )

        async with session_maker() as db:
            tid = UUID(topic_id) if isinstance(topic_id, str) else topic_id
            result = await db.execute(select(Topic).where(Topic.id == tid))
            topic = result.scalar_one_or_none()

            if not topic:
                await engine.dispose()
                return

            topic.status = "processing"
            topic.step = "searching_quran"
            await db.commit()

            try:
                async with make_mcp_http_client() as http_client:
                    async with streamable_http_client(
                        url=MCP_SERVER_URL,
                        http_client=http_client,
                    ) as (read, write, _):
                        async with ClientSession(read, write) as session:
                            await session.initialize()

                            search_result = await session.call_tool(
                                "search_quran",
                                arguments={
                                    "query": topic.canonical_query,
                                    "translations": "en-sahih-international",
                                },
                            )
                            parsed = parse_mcp_results(
                                extract_text_content(search_result)
                            )
                            top_verses = select_top_verses(parsed)

                            topic.step = "fetching_metadata"
                            await db.commit()

                            unique_surahs = {
                                int(v["ayah_key"].split(":", 1)[0])
                                for v in top_verses
                                if ":" in v["ayah_key"]
                            }
                            surah_names: dict[int, str] = {}
                            for surah_num in unique_surahs:
                                metadata_result = await session.call_tool(
                                    "fetch_quran_metadata",
                                    arguments={"surah": surah_num},
                                )
                                surah_names[surah_num] = extract_surah_transliteration(
                                    extract_text_content(metadata_result),
                                    surah_num,
                                )

                            tashkeel_texts = await asyncio.gather(
                                *[
                                    fetch_verse_arabic_with_tashkeel(
                                        session, verse["ayah_key"]
                                    )
                                    for verse in top_verses
                                ]
                            )
                            for verse, tashkeel_text in zip(top_verses, tashkeel_texts):
                                if tashkeel_text:
                                    verse["arabic_text"] = tashkeel_text

                            topic.step = "saving"
                            await db.commit()

                            for verse in top_verses:
                                surah_num = int(verse["ayah_key"].split(":", 1)[0])
                                verse["surah_name"] = surah_names.get(
                                    surah_num, f"Surah {surah_num}"
                                )

                            rows: list[TopicResult] = []
                            for index, verse in enumerate(top_verses):
                                rows.append(
                                    TopicResult(
                                        topic_id=topic.id,
                                        ayah_key=verse["ayah_key"],
                                        surah_name=verse["surah_name"],
                                        arabic_text=verse["arabic_text"],
                                        translation=verse["translation"],
                                        why_this_verse=None,
                                        rank=index,
                                        relevance_score=verse["relevance_score"],
                                        url=verse["url"],
                                    )
                                )

                            await db.execute(
                                delete(TopicResult).where(
                                    TopicResult.topic_id == topic.id
                                )
                            )
                            db.add_all(rows)
                            topic.status = "complete"
                            topic.step = None
                            topic.completed_at = datetime.now(UTC).replace(tzinfo=None)
                            await db.commit()

            except Exception as exc:
                logger.exception("Search task failed: {}", exc)
                topic.status = "failed"
                topic.step = f"error: {str(exc)}"
                await db.commit()

        await engine.dispose()

    asyncio.run(process())
