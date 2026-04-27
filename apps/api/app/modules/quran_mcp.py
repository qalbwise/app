import httpx

MCP_SERVER_URL = "https://mcp.quran.ai/"


def make_mcp_http_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        timeout=httpx.Timeout(30.0, read=60.0),
        follow_redirects=True,
        headers={"User-Agent": "Qalbwise/1.0 (+https://qalbwise.app)"},
    )
