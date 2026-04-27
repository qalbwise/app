import json

from loguru import logger
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.search import TopicResult
from app.modules.quran_mcp import MCP_SERVER_URL, make_mcp_http_client
from app.modules.tafsir.utils import extract_tafsir_text

TAFSIR_EDITIONS: tuple[tuple[str, str], ...] = (
    ("en-maarif-ul-quran", "Mufti Muhammad Shafi Usmani"),
    ("en-ibn-kathir", "Ibn Kathir"),
)


async def fetch_tafsir_for_verse(ayah_key: str) -> tuple[str, str, str] | None:
    async with make_mcp_http_client() as http_client:
        async with streamable_http_client(
            url=MCP_SERVER_URL,
            http_client=http_client,
        ) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()

                for edition_id, author in TAFSIR_EDITIONS:
                    try:
                        result = await session.call_tool(
                            "fetch_tafsir",
                            arguments={"ayahs": ayah_key, "editions": edition_id},
                        )
                    except Exception as exc:
                        logger.warning(
                            "Tafsir fetch failed for {} using {}: {}",
                            ayah_key,
                            edition_id,
                            exc,
                        )
                        continue

                    text_content = ""
                    for content in result.content or []:
                        if content.type == "text":
                            text_content = content.text
                            break

                    try:
                        data = json.loads(text_content)
                    except Exception:
                        continue

                    tafsir_text = extract_tafsir_text(data, edition_id)
                    if tafsir_text:
                        return tafsir_text[:3000], author, edition_id

    return None


async def get_or_fetch_tafsir(
    db: AsyncSession, topic_result: TopicResult
) -> TopicResult:
    if topic_result.tafsir_excerpt:
        return topic_result

    fetched = await fetch_tafsir_for_verse(topic_result.ayah_key)
    if not fetched:
        return topic_result

    tafsir_text, author, edition_id = fetched
    topic_result.tafsir_excerpt = tafsir_text
    topic_result.tafsir_author = author
    topic_result.tafsir_edition = edition_id
    await db.commit()
    await db.refresh(topic_result)
    return topic_result
