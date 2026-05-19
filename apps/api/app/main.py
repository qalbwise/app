from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from scalar_fastapi import get_scalar_api_reference
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.auth.router import router as auth_router
from app.api.bookmarks.router import router as bookmarks_router
from app.api.notes.router import router as notes_router
from app.api.search.router import router as search_router
from app.api.users.router import router as users_router
from app.core.redis import close_redis
from app.core.settings import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up the API...")
    yield
    logger.info("Shutting down...")
    await close_redis()
    logger.info("API shut down")


app = FastAPI(lifespan=lifespan, title="Qalbwise API")

settings = get_settings()

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.REDIS_URL,
    default_limits=["100/minute"],
)
app.state.limiter = limiter
app.state.frontend_url = settings.FRONTEND_URL
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "https://qalbwise.app",
    "https://www.qalbwise.app",
    "https://api.qalbwise.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(search_router)
app.include_router(notes_router)
app.include_router(bookmarks_router)


@app.get("/scalar", include_in_schema=False)
async def scalar():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        scalar_proxy_url="https://proxy.scalar.com",
    )
