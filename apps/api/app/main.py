from fastapi import FastAPI
from loguru import logger
from scalar_fastapi import get_scalar_api_reference

from app.api.auth.router import router as auth_router

app = FastAPI()


@app.on_event("startup")
async def startup():
    logger.info("API starting up")


@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(auth_router)


@app.get("/scalar", include_in_schema=False)
async def scalar():
    return get_scalar_api_reference(
        # Your OpenAPI document
        openapi_url=app.openapi_url,
        # Avoid CORS issues (optional)
        scalar_proxy_url="https://proxy.scalar.com",
    )
