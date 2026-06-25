import asyncio

from celery.utils.log import get_task_logger

from app.db.session import AsyncSessionLocal
from app.integrations.gigachat import GigaChatError, gigachat_client
from app.models.enums import MessageStatus
from app.services.chat_message import ChatMessageService
from app.worker.celery_app import celery_app


logger = get_task_logger(__name__)


async def _process_gigachat_message(
    assistant_message_id: int,
    chat_id: int,
) -> None:
    async with AsyncSessionLocal() as db:
        service = ChatMessageService(db)

        await service.update_assistant_message(
            message_id=assistant_message_id,
            status=MessageStatus.PROCESSING,
        )

        messages = await service.build_gigachat_history(
            chat_id=chat_id,
            limit=20,
        )

        response_text, gigachat_message_id = await gigachat_client.chat_completion(
            messages=messages,
        )

        await service.update_assistant_message(
            message_id=assistant_message_id,
            text=response_text,
            status=MessageStatus.COMPLETED,
            gigachat_message_id=gigachat_message_id,
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
    default_retry_delay=10,
)
def process_gigachat_message(
    self,
    assistant_message_id: int,
    chat_id: int,
) -> None:
    try:
        logger.info(
            "Start GigaChat processing assistant_message_id=%s chat_id=%s",
            assistant_message_id,
            chat_id,
        )

        asyncio.run(
            _process_gigachat_message(
                assistant_message_id=assistant_message_id,
                chat_id=chat_id,
            )
        )

        logger.info(
            "Completed GigaChat processing assistant_message_id=%s",
            assistant_message_id,
        )

    except GigaChatError as exc:
        logger.exception(
            "GigaChat error assistant_message_id=%s",
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

    except Exception as exc:
        logger.exception(
            "Unexpected error assistant_message_id=%s",
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