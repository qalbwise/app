from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from scalar_fastapi import get_scalar_api_reference

from app.api.auth.router import router as auth_router
from app.api.bookmarks.router import router as bookmarks_router
from app.api.search.router import router as search_router
from app.api.tafsir.router import router as tafsir_router

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "https://qalbwise.app",
    "https://www.qalbwise.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
