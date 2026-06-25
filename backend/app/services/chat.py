from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.chat import Chat
from app.models.enums import MessageSenderType, MessageStatus
from app.models.user import User
from app.repositories.chat import ChatRepository
from app.repositories.chat_message import ChatMessageRepository
from app.repositories.prompt import PromptRepository
from app.schemas.chat import ChatCreate, ChatUpdate


class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.chats = ChatRepository(db)
        self.messages = ChatMessageRepository(db)
        self.prompts = PromptRepository(db)

    async def create_chat(self, data: ChatCreate, current_user: User) -> Chat:
        create_data = data.model_dump()
        create_data["user_id"] = current_user.id

        chat = await self.chats.create(create_data)

        await self.db.commit()
        await self.db.refresh(chat)

        return chat

    async def create_chat_from_prompt(
        self,
        prompt_id: int,
        current_user: User,
        title: str | None = None,
    ) -> tuple[Chat, object, object]:
        prompt = await self.prompts.get_active(prompt_id)

        if not prompt:
            raise NotFoundError("Промпт не найден")

        chat_title = title or prompt.short_description

        chat = await self.chats.create(
            {
                "user_id": current_user.id,
                "title": chat_title,
            }
        )

        user_message = await self.messages.create(
            {
                "chat_id": chat.id,
                "user_id": current_user.id,
                "sender_type": MessageSenderType.USER,
                "status": MessageStatus.COMPLETED,
                "text": prompt.text,
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

        await self.db.commit()

        await self.db.refresh(chat)
        await self.db.refresh(user_message)
        await self.db.refresh(assistant_message)

        from app.tasks.gigachat import process_gigachat_message

        process_gigachat_message.delay(
            assistant_message.id,
            chat.id,
        )

        return chat, user_message, assistant_message

    async def get_chat(self, chat_id: int, current_user: User) -> Chat:
        chat = await self.chats.get_by_user_with_messages(
            chat_id=chat_id,
            user_id=current_user.id,
        )

        if not chat:
            raise NotFoundError("Чат не найден")

        return chat

    async def list_chats(
        self,
        current_user: User,
        offset: int = 0,
        limit: int = 100,
    ) -> tuple[list[Chat], int]:
        chats = await self.chats.list_by_user(
            user_id=current_user.id,
            offset=offset,
            limit=limit,
        )

        total = await self.chats.count_by_user(current_user.id)

        return chats, total

    async def update_chat(
        self,
        chat_id: int,
        current_user: User,
        data: ChatUpdate,
    ) -> Chat:
        chat = await self.chats.get_by_user(
            chat_id=chat_id,
            user_id=current_user.id,
        )

        if not chat:
            raise NotFoundError("Чат не найден")

        update_data = data.model_dump(exclude_unset=True)

        if not update_data:
            return chat

        chat = await self.chats.update(chat, update_data)

        await self.db.commit()
        await self.db.refresh(chat)

        return chat

    async def soft_delete_chat(self, chat_id: int, current_user: User) -> Chat:
        chat = await self.chats.get_by_user(
            chat_id=chat_id,
            user_id=current_user.id,
        )

        if not chat:
            raise NotFoundError("Чат не найден")

        chat = await self.chats.update(
            chat,
            {
                "is_active": False,
            },
        )

        await self.db.commit()
        await self.db.refresh(chat)

        return chat