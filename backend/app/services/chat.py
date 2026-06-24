from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.chat import Chat
from app.repositories.chat import ChatRepository
from app.schemas.chat import ChatCreate, ChatUpdate


class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.chats = ChatRepository(db)

    async def create_chat(
        self,
        data: ChatCreate,
        user_id: int,
    ) -> Chat:
        create_data = data.model_dump()
        create_data["user_id"] = user_id

        chat = await self.chats.create(create_data)

        await self.db.commit()
        await self.db.refresh(chat)

        return chat

    async def get_chat(
        self,
        chat_id: int,
        user_id: int,
    ) -> Chat:
        chat = await self.chats.get_by_user_with_messages(chat_id, user_id)

        if not chat:
            raise NotFoundError("Чат не найден")

        return chat

    async def list_chats(
        self,
        user_id: int,
        offset: int = 0,
        limit: int = 100,
    ) -> list[Chat]:
        return await self.chats.list_by_user(
            user_id=user_id,
            offset=offset,
            limit=limit,
        )

    async def update_chat(
        self,
        chat_id: int,
        user_id: int,
        data: ChatUpdate,
    ) -> Chat:
        chat = await self.chats.get_by_user(chat_id, user_id)

        if not chat:
            raise NotFoundError("Чат не найден")

        update_data = data.model_dump(exclude_unset=True)

        chat = await self.chats.update(chat, update_data)

        await self.db.commit()
        await self.db.refresh(chat)

        return chat

    async def soft_delete_chat(
        self,
        chat_id: int,
        user_id: int,
    ) -> Chat:
        chat = await self.chats.get_by_user(chat_id, user_id)

        if not chat:
            raise NotFoundError("Чат не найден")

        chat = await self.chats.update(chat, {"is_active": False})

        await self.db.commit()
        await self.db.refresh(chat)

        return chat