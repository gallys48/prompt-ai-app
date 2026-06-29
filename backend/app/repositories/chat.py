from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.chat import Chat
from app.repositories.base import BaseRepository


class ChatRepository(BaseRepository[Chat]):
    def __init__(self, db: AsyncSession):
        super().__init__(Chat, db)

    async def get_by_user(self, chat_id: int, user_id: int) -> Chat | None:
        stmt = select(Chat).where(
            Chat.id == chat_id,
            Chat.user_id == user_id,
            Chat.is_active.is_(True),
        )

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_id(self, chat_id: int) -> Chat | None:
        stmt = select(Chat).where(
            Chat.id == chat_id,
            Chat.is_active.is_(True),
        )

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user_with_messages(
        self,
        chat_id: int,
        user_id: int,
    ) -> Chat | None:
        stmt = (
            select(Chat)
            .options(selectinload(Chat.messages))
            .where(
                Chat.id == chat_id,
                Chat.user_id == user_id,
                Chat.is_active.is_(True),
            )
        )

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_user(
        self,
        user_id: int,
        offset: int = 0,
        limit: int = 100,
    ) -> list[Chat]:
        stmt = (
            select(Chat)
            .where(
                Chat.user_id == user_id,
                Chat.is_active.is_(True),
            )
            .order_by(desc(Chat.updated_at))
            .offset(offset)
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def count_by_user(self, user_id: int) -> int:
        stmt = select(func.count(Chat.id)).where(
            Chat.user_id == user_id,
            Chat.is_active.is_(True),
        )

        result = await self.db.execute(stmt)
        return int(result.scalar_one())