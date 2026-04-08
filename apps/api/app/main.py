from fastapi import FastAPI
from loguru import logger

app = FastAPI()


@app.on_event("startup")
async def startup():
    logger.info("API starting up")


@app.get("/health")
async def health():
    return {"status": "ok"}
