import asyncio
from celery.utils.log import get_task_logger

from app.db.session import AsyncSessionLocal
from app.models.enums import MessageStatus
from app.services.chat_message import ChatMessageService
from app.worker.celery_app import celery_app


logger = get_task_logger(__name__)


def build_stub_gigachat_response(user_text: str) -> str:
    return (
        "Ответ получен через Celery worker.\n\n"
        f"Твоё сообщение:\n{user_text}\n\n"
        "Пока это тестовая заглушка. На следующем этапе здесь будет реальный "
        "запрос в GigaChat."
    )


async def _process_gigachat_message(
    assistant_message_id: int,
    user_text: str,
) -> None:
    async with AsyncSessionLocal() as db:
        service = ChatMessageService(db)

        await service.update_assistant_message(
            message_id=assistant_message_id,
            status=MessageStatus.PROCESSING,
        )

        await asyncio.sleep(2)

        response_text = build_stub_gigachat_response(user_text)

        await service.update_assistant_message(
            message_id=assistant_message_id,
            text=response_text,
            status=MessageStatus.COMPLETED,
            gigachat_message_id=f"stub-{assistant_message_id}",
            error_message=None,
        )


async def _mark_message_failed(
    assistant_message_id: int,
    error_message: str,
) -> None:
    async with AsyncSessionLocal() as db:
        service = ChatMessageService(db)

        await service.update_assistant_message(
            message_id=assistant_message_id,
            status=MessageStatus.FAILED,
            error_message=error_message,
        )


@celery_app.task(
    name="app.tasks.gigachat.process_gigachat_message",
    bind=True,
    max_retries=3,
    default_retry_delay=5,
)
def process_gigachat_message(
    self,
    assistant_message_id: int,
    user_text: str,
) -> None:
    try:
        logger.info(
            "Start processing assistant_message_id=%s",
            assistant_message_id,
        )

        asyncio.run(
            _process_gigachat_message(
                assistant_message_id=assistant_message_id,
                user_text=user_text,
            )
        )

        logger.info(
            "Completed assistant_message_id=%s",
            assistant_message_id,
        )

    except Exception as exc:
        logger.exception(
            "Failed processing assistant_message_id=%s",
            assistant_message_id,
        )

        if self.request.retries >= self.max_retries:
            asyncio.run(
                _mark_message_failed(
                    assistant_message_id=assistant_message_id,
                    error_message=str(exc),
                )
            )
            raise

        raise self.retry(exc=exc)