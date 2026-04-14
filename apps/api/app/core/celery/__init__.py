from app.core.settings import get_settings
from celery import Celery

settings = get_settings()

celery_app = Celery(
    "qalbwise",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.modules.search.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=180,
    task_default_queue="default",
)
