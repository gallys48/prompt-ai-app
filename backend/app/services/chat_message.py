from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.chat_message import ChatMessage
from app.models.enums import MessageSenderType, MessageStatus
from app.models.user import User
from app.repositories.chat import ChatRepository
from app.repositories.chat_message import ChatMessageRepository


class ChatMessageService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.chats = ChatRepository(db)
        self.messages = ChatMessageRepository(db)

    def _build_stub_assistant_response(self, user_text: str) -> str:
        return (
            "Тестовый ответ assistant без обращения к GigaChat.\n\n"
            f"Ты отправил сообщение:\n{user_text}\n\n"
            "На следующем этапе это место заменим на фоновую задачу через "
            "RabbitMQ/Celery и реальный ответ GigaChat."
        )

    async def send_message_with_stub_response(
        self,
        chat_id: int,
        current_user: User,
        text: str,
    ) -> tuple[ChatMessage, ChatMessage]:
        chat = await self.chats.get_by_user(
            chat_id=chat_id,
            user_id=current_user.id,
        )

        if not chat:
            raise NotFoundError("Чат не найден")

        user_message = await self.messages.create(
            {
                "chat_id": chat.id,
                "user_id": current_user.id,
                "sender_type": MessageSenderType.USER,
                "status": MessageStatus.COMPLETED,
                "text": text,
            }
        )

        assistant_message = await self.messages.create(
            {
                "chat_id": chat.id,
                "user_id": None,
                "sender_type": MessageSenderType.ASSISTANT,
                "status": MessageStatus.COMPLETED,
                "text": self._build_stub_assistant_response(text),
            }
        )

        chat.updated_at = datetime.now(UTC)
        self.db.add(chat)

        await self.db.commit()

        await self.db.refresh(user_message)
        await self.db.refresh(assistant_message)

        return user_message, assistant_message

    async def create_user_message(
        self,
        chat_id: int,
        user_id: int,
        text: str,
    ) -> ChatMessage:
        chat = await self.chats.get_by_user(chat_id, user_id)

        if not chat:
            raise NotFoundError("Чат не найден")

        message = await self.messages.create(
            {
                "chat_id": chat_id,
                "user_id": user_id,
                "sender_type": MessageSenderType.USER,
                "status": MessageStatus.COMPLETED,
                "text": text,
            }
        )

        await self.db.commit()
        await self.db.refresh(message)

        return message

    async def create_assistant_message(
        self,
        chat_id: int,
        text: str | None = None,
        status: MessageStatus = MessageStatus.PENDING,
        gigachat_message_id: str | None = None,
        error_message: str | None = None,
    ) -> ChatMessage:
        chat = await self.chats.get(chat_id)

        if not chat or not chat.is_active:
            raise NotFoundError("Чат не найден")

        message = await self.messages.create(
            {
                "chat_id": chat_id,
                "user_id": None,
                "sender_type": MessageSenderType.ASSISTANT,
                "status": status,
                "text": text,
                "gigachat_message_id": gigachat_message_id,
                "error_message": error_message,
            }
        )

        await self.db.commit()
        await self.db.refresh(message)

        return message

    async def update_assistant_message(
        self,
        message_id: int,
        text: str | None = None,
        status: MessageStatus = MessageStatus.COMPLETED,
        gigachat_message_id: str | None = None,
        error_message: str | None = None,
    ) -> ChatMessage:
        message = await self.messages.get(message_id)

        if not message:
            raise NotFoundError("Сообщение не найдено")

        message = await self.messages.update(
            message,
            {
                "text": text,
                "status": status,
                "gigachat_message_id": gigachat_message_id,
                "error_message": error_message,
            },
        )

        await self.db.commit()
        await self.db.refresh(message)

        return message