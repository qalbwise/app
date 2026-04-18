from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from scalar_fastapi import get_scalar_api_reference
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.auth.router import router as auth_router
from app.api.bookmarks.router import router as bookmarks_router
from app.api.search.router import router as search_router
from app.api.tafsir.router import router as tafsir_router
from app.api.users.router import router as users_router
from app.core.settings import get_settings

app = FastAPI()

_settings = get_settings()

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=_settings.REDIS_URL,
    default_limits=["100/minute"],
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


def _cors_allow_origins() -> list[str]:
    """Prod domains, localhost:3000–3009, optional CORS_EXTRA_ORIGINS."""
    out: list[str] = [
        "https://qalbwise.app",
        "https://www.qalbwise.app",
        "https://api.qalbwise.app",
    ]
    for port in range(3000, 3010):
        out.append(f"http://localhost:{port}")
        out.append(f"http://127.0.0.1:{port}")
    extra = (get_settings().CORS_EXTRA_ORIGINS or "").strip()
    if extra:
        out.extend(x.strip() for x in extra.split(",") if x.strip())
    return list(dict.fromkeys(out))


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_allow_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    logger.info("API starting up")


@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(search_router)
app.include_router(tafsir_router)
app.include_router(bookmarks_router)


@app.get("/scalar", include_in_schema=False)
async def scalar():
    return get_scalar_api_reference(
        # Your OpenAPI document
        openapi_url=app.openapi_url,
        # Avoid CORS issues (optional)
        scalar_proxy_url="https://proxy.scalar.com",
    )
