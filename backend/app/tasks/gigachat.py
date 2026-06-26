import asyncio
import logging

from app.db.session import AsyncSessionLocal
from app.integrations.gigachat import GigaChatError, gigachat_client
from app.models.enums import MessageStatus
from app.services.chat_message import ChatMessageService
from app.worker.celery_app import celery_app


logger = logging.getLogger(__name__)


async def _process_gigachat_message(
    assistant_message_id: int,
    chat_id: int,
) -> None:
    async with AsyncSessionLocal() as db:
        service = ChatMessageService(db)

        logger.info(
            "Set assistant message processing assistant_message_id=%s chat_id=%s",
            assistant_message_id,
            chat_id,
        )

        await service.update_assistant_message(
            message_id=assistant_message_id,
            status=MessageStatus.PROCESSING,
        )

        messages = await service.build_gigachat_history(
            chat_id=chat_id,
            limit=20,
        )

        logger.info(
            "Built GigaChat history assistant_message_id=%s chat_id=%s messages_count=%s",
            assistant_message_id,
            chat_id,
            len(messages),
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

        logger.info(
            "Assistant message completed assistant_message_id=%s chat_id=%s gigachat_message_id=%s",
            assistant_message_id,
            chat_id,
            gigachat_message_id,
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
            error_message=error_message[:1000],
        )

        logger.warning(
            "Assistant message marked failed assistant_message_id=%s error_preview=%s",
            assistant_message_id,
            error_message[:300],
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
            "Start GigaChat task task_id=%s assistant_message_id=%s chat_id=%s retry=%s",
            self.request.id,
            assistant_message_id,
            chat_id,
            self.request.retries,
        )

        asyncio.run(
            _process_gigachat_message(
                assistant_message_id=assistant_message_id,
                chat_id=chat_id,
            )
        )

        logger.info(
            "Completed GigaChat task task_id=%s assistant_message_id=%s chat_id=%s",
            self.request.id,
            assistant_message_id,
            chat_id,
        )

    except GigaChatError as exc:
        logger.exception(
            "GigaChat task error task_id=%s assistant_message_id=%s chat_id=%s retry=%s",
            self.request.id,
            assistant_message_id,
            chat_id,
            self.request.retries,
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
            "Unexpected GigaChat task error task_id=%s assistant_message_id=%s chat_id=%s retry=%s",
            self.request.id,
            assistant_message_id,
            chat_id,
            self.request.retries,
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