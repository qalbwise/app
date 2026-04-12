import json

from fastapi import APIRouter, HTTPException, status
from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamable_http_client

from app.api.search.serializer import TafsirResponse

router = APIRouter(prefix="/tafsir", tags=["tafsir"])

MCP_SERVER_URL = "https://mcp.quran.ai/"


async def get_tafsir_async(query: str) -> dict:
    async with streamable_http_client(MCP_SERVER_URL) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()

            result = await session.call_tool(
                "search_tafsir",
                arguments={"query": query, "include_ayah_text": True},
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


@router.get("/{ayah_key}", response_model=TafsirResponse)
async def get_tafsir(ayah_key: str):
    try:
        data = await get_tafsir_async(ayah_key)

        tafsir_text = data.get("tafsir", "")
        source = data.get("source", None)

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
