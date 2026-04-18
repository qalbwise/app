import asyncio
import json
import re as _re
from uuid import UUID

import httpx
from celery import Task
from loguru import logger
from sqlalchemy import select

from app.core.celery import celery_app
from app.models.search import Search
from app.models.user import User
from app.modules.llm.prompts import append_english_only
from app.modules.users.service import preferences_from_row


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


def _pick_english_translation(translations: list[dict]) -> tuple[str, str]:
    """Prefer an English edition; MCP often lists fr/ar entries before en."""
    if not translations:
        return "", ""

    def edition_lang(t: dict) -> str:
        ed = t.get("edition") or {}
        return str(ed.get("language_name") or ed.get("language") or "").lower()

    for t in translations:
        lang = edition_lang(t)
        if "english" in lang or lang == "en":
            ed = t.get("edition") or {}
            author = ed.get("author_name") or ed.get("author") or ""
            return _strip_html(t.get("text", "")), author

    t0 = translations[0]
    ed0 = t0.get("edition") or {}
    return _strip_html(t0.get("text", "")), (
        ed0.get("author_name") or ed0.get("author") or ""
    )


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

        raw_translation, translator = _pick_english_translation(translations)

        parsed.append(
            {
                "ayah_key": ayah_key,
                "surah_name": surah_name,
                "arabic_text": item.get("text", ""),
                "translation": raw_translation,
                "translator": translator,
                "relevance_score": item.get("relevance_score", 0.0),
                "url": item.get("url", ""),
            }
        )

    return parsed


QDC_VERSES_UTHMANI = "https://api.quran.com/api/v4/quran/verses/uthmani"
QDC_VERSES_INDOPAK = "https://api.quran.com/api/v4/quran/verses/indopak"
QDC_TRANSLATION_EN_SAHEEH = 20
QDC_TRANSLATIONS_URL = "https://api.quran.com/api/v4/quran/translations"


async def enrich_verses_from_quran_com(
    verses: list[dict], *, use_indopak_edition: bool
) -> None:
    """
    MCP search: Arabic is often rasm-only; translations may be the wrong locale.
    Quran.com supplies vocalized Arabic (Uthmani / IndoPak) and Saheeh
    International (English).
    """
    if not verses:
        return

    arabic_url = QDC_VERSES_INDOPAK if use_indopak_edition else QDC_VERSES_UTHMANI
    text_key = "text_indopak" if use_indopak_edition else "text_uthmani"
    trans_url = f"{QDC_TRANSLATIONS_URL}/{QDC_TRANSLATION_EN_SAHEEH}"

    async def fetch_one(client: httpx.AsyncClient, verse: dict) -> None:
        key = (verse.get("ayah_key") or "").strip()
        if not key:
            return
        try:
            ar_task = client.get(arabic_url, params={"verse_key": key})
            tr_task = client.get(trans_url, params={"verse_key": key})
            ar, tr = await asyncio.gather(ar_task, tr_task)
            ar.raise_for_status()
            tr.raise_for_status()
            ar_data = ar.json()
            tr_data = tr.json()
            aitems = ar_data.get("verses") or []
            if aitems:
                text = aitems[0].get(text_key)
                if isinstance(text, str) and text.strip():
                    verse["arabic_text"] = text.strip()
            titems = tr_data.get("translations") or []
            if titems:
                ttext = titems[0].get("text")
                if isinstance(ttext, str) and ttext.strip():
                    verse["translation"] = _strip_html(ttext.strip())
                    meta = tr_data.get("meta") or {}
                    verse["translator"] = (
                        meta.get("author_name") or "Saheeh International"
                    )
        except Exception as exc:
            logger.warning("Quran.com verse enrich failed for {}: {}", key, exc)

    limits = httpx.Limits(max_keepalive_connections=10, max_connections=20)
    timeout = httpx.Timeout(30.0)
    async with httpx.AsyncClient(
        limits=limits,
        timeout=timeout,
        follow_redirects=True,
    ) as client:
        await asyncio.gather(*(fetch_one(client, v) for v in verses))


def fallback_ranked_verses(verses: list[dict], max_n: int = 5) -> list[dict]:
    """MCP order when LLM ranking is unavailable."""
    ranked: list[dict] = []
    for i, verse in enumerate(verses[:max_n]):
        verse_copy = verse.copy()
        verse_copy["rank"] = i
        ranked.append(verse_copy)
    return ranked


async def rank_with_openai_async(topic: str, verses: list[dict]) -> list[dict]:
    if not verses:
        return []

    verses_text = "\n\n".join(
        f"Verse {i + 1} ({v.get('ayah_key', '')}): {v.get('arabic_text', '')}\n"
        f"Translation: {v.get('translation', '')}"
        for i, v in enumerate(verses[:20])
    )

    prompt = f"""
Given the user's topic: "{topic}"

Here are the top relevant verses from the Quran:
{verses_text}

Rank the top 3-5 verses that best relate to this topic.
For each verse, provide the index (1-based) and a one-sentence explanation.

Respond in JSON format only, with no extra text:
[{{"index": 1, "why_this_verse": "..."}}, {{"index": 3, "why_this_verse": "..."}}]
"""

    prompt = append_english_only(prompt)

    from app.core.settings import get_settings, llm_api_key, llm_client_kwargs

    settings = get_settings()

    if not llm_api_key(settings):
        logger.info(
            "No LLM API key (OPENROUTER_API_KEY or OPENAI_API_KEY); skipping ranking"
        )
        return fallback_ranked_verses(verses)

    from openai import AsyncOpenAI

    client = AsyncOpenAI(**llm_client_kwargs(settings))

    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
        )
    except Exception as exc:
        logger.warning("OpenAI ranking failed, using search order: {}", exc)
        return fallback_ranked_verses(verses)

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
        logger.info(f"Failed to parse ranking JSON, raw content: {content}")
        rankings = []

    if not isinstance(rankings, list):
        return fallback_ranked_verses(verses)

    index_map: dict[int, str] = {}
    ordered_indices: list[int] = []
    for r in rankings:
        if not isinstance(r, dict):
            continue
        try:
            idx = int(r["index"])
            why = str(r.get("why_this_verse") or "")
        except (KeyError, ValueError, TypeError):
            continue
        if 1 <= idx <= len(verses):
            index_map[idx] = why
            ordered_indices.append(idx)

    seen_idx: set[int] = set()
    unique_order: list[int] = []
    for idx in ordered_indices:
        if idx not in seen_idx:
            seen_idx.add(idx)
            unique_order.append(idx)

    if not unique_order:
        return fallback_ranked_verses(verses)

    ranked: list[dict] = []
    used_i: set[int] = set()
    for idx in unique_order:
        i = idx - 1
        verse_copy = verses[i].copy()
        verse_copy["why_this_verse"] = index_map.get(idx, "")
        verse_copy["rank"] = len(ranked)
        ranked.append(verse_copy)
        used_i.add(i)

    for i, verse in enumerate(verses):
        if i in used_i:
            continue
        if len(ranked) >= 5:
            break
        verse_copy = verse.copy()
        verse_copy["rank"] = len(ranked)
        ranked.append(verse_copy)

    return ranked[:5]


async def get_verse_explanation_async(topic: str, verse: dict) -> str:
    if not verse:
        return ""

    ayah_key = verse.get("ayah_key", "")
    arabic_text = verse.get("arabic_text", "")
    translation = verse.get("translation", "")

    prompt = f"""
You are a compassionate Quranic guide helping users find meaning and \
comfort in the words of Allah.

User's message: "{topic}"

Verse ({ayah_key}):
Arabic: {arabic_text}
Translation: {translation}

First, sense the tone of the user's message:
- If it is personal, emotional, or reflective (e.g. seeking comfort, gratitude, hope): \
    respond with warmth and speak directly to their heart — as if you \
    are gently reminding them of Allah's care.
- If it is a general topic or question: \
    respond with a clear and concise scholarly explanation of the connection.

In exactly one sentence, explain how this verse speaks to the user's message.
Do not restate the verse. Do not add greetings or filler text.
"""

    prompt = append_english_only(prompt)

    from app.core.settings import get_settings, llm_api_key, llm_client_kwargs

    settings = get_settings()

    from openai import AsyncOpenAI

    if not llm_api_key(settings):
        return ""

    client = AsyncOpenAI(**llm_client_kwargs(settings))

    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
        )
    except Exception as exc:
        logger.warning("OpenAI verse explanation failed: {}", exc)
        return ""

    content = response.choices[0].message.content or ""
    return content.strip()


@celery_app.task(bind=True, base=CallbackTask)
def run_search(self, search_id: str):
    async def process():
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
            sid = UUID(search_id) if isinstance(search_id, str) else search_id
            result = await db.execute(select(Search).where(Search.id == sid))
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

                use_indopak_edition = False
                if search.user_id:
                    urow = await db.execute(
                        select(User).where(User.id == search.user_id)
                    )
                    user = urow.scalar_one_or_none()
                    if user and user.preferences:
                        prefs = preferences_from_row(user.preferences)
                        use_indopak_edition = prefs.arabic_font == "indopak"

                if parsed:
                    await enrich_verses_from_quran_com(
                        parsed, use_indopak_edition=use_indopak_edition
                    )

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

    asyncio.run(process())
