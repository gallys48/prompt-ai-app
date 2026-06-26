from celery import Celery

from app.core.config import settings
from app.core.logging import setup_logging


setup_logging()


celery_app = Celery(
    "prompt_ai",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.gigachat",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Krasnoyarsk",
    enable_utc=True,
    task_track_started=True,
    task_ignore_result=True,
)