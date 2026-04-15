import json
from html.parser import HTMLParser

from fastapi import APIRouter, HTTPException, status
from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamable_http_client

from app.api.search.serializer import TafsirResponse

router = APIRouter(prefix="/tafsir", tags=["tafsir"])

MCP_SERVER_URL = "https://mcp.quran.ai/"


class HTMLToPlainText(HTMLParser):
    """Convert HTML to plain text."""

    def __init__(self):
        super().__init__()
        self.text_parts = []

    def handle_data(self, data: str):
        if data.strip():
            self.text_parts.append(data.strip())

    def get_text(self) -> str:
        return " ".join(self.text_parts)


async def get_tafsir_async(ayah_key: str) -> dict:
    """Fetch tafsir for a specific ayah using the Quran MCP."""
    async with streamable_http_client(MCP_SERVER_URL) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()

            result = await session.call_tool(
                "fetch_tafsir",
                arguments={
                    "ayahs": ayah_key,
                    "editions": "en-ibn-kathir",
                },
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
                return {}


def extract_tafsir_text(data: dict, ayah_key: str) -> tuple[str, str | None]:
    """
    Extract tafsir text and source from the fetch_tafsir response.

    Returns: (tafsir_text, source_edition)
    """
    if not data or "results" not in data:
        return "", None

    results = data.get("results", {})
    if not results:
        return "", None

    # Get the first available edition's tafsir
    for edition_id, tafsir_passages in results.items():
        if tafsir_passages and len(tafsir_passages) > 0:
            passage = tafsir_passages[0]
            html_text = passage.get("text", "")

            # Convert HTML to plain text
            parser = HTMLToPlainText()
            parser.feed(html_text)
            plain_text = parser.get_text()

            return plain_text, edition_id

    return "", None


@router.get("/{ayah_key}", response_model=TafsirResponse)
async def get_tafsir(ayah_key: str):
    try:
        data = await get_tafsir_async(ayah_key)

        tafsir_text, source = extract_tafsir_text(data, ayah_key)

        return TafsirResponse(
            ayah_key=ayah_key,
            tafsir=tafsir_text,
            source=source,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch tafsir: {str(e)}",
        )
