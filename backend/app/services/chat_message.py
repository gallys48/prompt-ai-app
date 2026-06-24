from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.chat_message import ChatMessage
from app.models.enums import MessageSenderType, MessageStatus
from app.repositories.chat import ChatRepository
from app.repositories.chat_message import ChatMessageRepository


class ChatMessageService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.chats = ChatRepository(db)
        self.messages = ChatMessageRepository(db)

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

        await self.chats.update(
            chat,
            {
                "updated_at": datetime.now(timezone.utc),
            },
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

        await self.chats.update(
            chat,
            {
                "updated_at": datetime.now(timezone.utc),
            },
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

        update_data = {
            "status": status,
        }

        if text is not None:
            update_data["text"] = text

        if gigachat_message_id is not None:
            update_data["gigachat_message_id"] = gigachat_message_id

        if error_message is not None:
            update_data["error_message"] = error_message

        message = await self.messages.update(message, update_data)

        chat = await self.chats.get(message.chat_id)

        if chat and chat.is_active:
            await self.chats.update(
                chat,
                {
                    "updated_at": datetime.now(timezone.utc),
                },
            )

        await self.db.commit()
        await self.db.refresh(message)

        return message