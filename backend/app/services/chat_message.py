from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError, NotFoundError, ForbiddenError
from app.models.chat_message import ChatMessage
from app.models.enums import MessageSenderType, MessageStatus
from app.models.user import User
from app.models.enums import UserRole
from app.repositories.chat import ChatRepository
from app.repositories.chat_message import ChatMessageRepository
from app.schemas.chat_message import ChatMessageListResponse


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

    async def send_message_to_gigachat(
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
                "status": MessageStatus.PENDING,
                "text": None,
            }
        )

        chat.updated_at = datetime.now(UTC)
        self.db.add(chat)

        await self.db.commit()

        await self.db.refresh(user_message)
        await self.db.refresh(assistant_message)

        from app.tasks.gigachat import process_gigachat_message

        process_gigachat_message.delay(
            assistant_message.id,
            chat.id,
        )

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
    
    async def build_gigachat_history(
        self,
        chat_id: int,
        limit: int = 20,
    ) -> list[dict[str, str]]:
        messages = await self.messages.list_recent_completed_by_chat(
            chat_id=chat_id,
            limit=limit,
        )

        result: list[dict[str, str]] = []

        for message in messages:
            if not message.text:
                continue

            if message.sender_type == MessageSenderType.USER:
                role = "user"
            elif message.sender_type == MessageSenderType.ASSISTANT:
                role = "assistant"
            else:
                role = "system"

            result.append(
                {
                    "role": role,
                    "content": message.text,
                }
            )

        return result
    
    async def get_message(
        self,
        chat_id: int,
        message_id: int,
        current_user: User,
    ) -> ChatMessage:
        chat = await self.chats.get_by_user(
            chat_id=chat_id,
            user_id=current_user.id,
        )

        if not chat:
            raise NotFoundError("Чат не найден")

        message = await self.messages.get_by_chat(
            message_id=message_id,
            chat_id=chat.id,
        )

        if not message:
            raise NotFoundError("Сообщение не найдено")

        return message

    async def retry_failed_assistant_message(
        self,
        chat_id: int,
        message_id: int,
        current_user: User,
    ) -> ChatMessage:
        chat = await self.chats.get_by_user(
            chat_id=chat_id,
            user_id=current_user.id,
        )

        if not chat:
            raise NotFoundError("Чат не найден")

        message = await self.messages.get_by_chat(
            message_id=message_id,
            chat_id=chat.id,
        )

        if not message:
            raise NotFoundError("Сообщение не найдено")

        if message.sender_type != MessageSenderType.ASSISTANT:
            raise BadRequestError("Повторно можно запускать только assistant-сообщение")

        if message.status != MessageStatus.FAILED:
            raise BadRequestError("Повторно можно запускать только сообщение со статусом failed")

        message = await self.messages.update(
            message,
            {
                "status": MessageStatus.PENDING,
                "text": None,
                "error_message": None,
                "gigachat_message_id": None,
            },
        )

        chat.updated_at = datetime.now(UTC)
        self.db.add(chat)

        await self.db.commit()
        await self.db.refresh(message)

        from app.tasks.gigachat import process_gigachat_message

        process_gigachat_message.delay(
            message.id,
            chat.id,
        )

        return message
    
    async def list_chat_messages(
        self,
        chat_id: int,
        current_user: User,
        offset: int = 0,
        limit: int = 50,
    ) -> ChatMessageListResponse:
        chat = await self.chats.get_by_id(chat_id = chat_id)

        if chat is None:
            raise NotFoundError("Chat not found")

        if chat.user_id != current_user.id and current_user.role not in {
            UserRole.SUPERUSER,
            UserRole.ADMIN,
        }:
            raise ForbiddenError("You do not have access to this chat")

        total = await self.messages.count_by_chat(chat_id)
        messages = await self.messages.list_by_chat(
            chat_id=chat_id,
            offset=offset,
            limit=limit,
        )

        return ChatMessageListResponse(
            items=messages,
            total=total,
            offset=offset,
            limit=limit,
            has_more=offset + limit < total,
    )