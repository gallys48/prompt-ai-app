from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat_message import ChatMessage
from app.models.enums import MessageStatus
from app.repositories.base import BaseRepository


class ChatMessageRepository(BaseRepository[ChatMessage]):
    def __init__(self, db: AsyncSession):
        super().__init__(ChatMessage, db)

    async def get_by_chat(
        self,
        message_id: int,
        chat_id: int,
    ) -> ChatMessage | None:
        stmt = select(ChatMessage).where(
            ChatMessage.id == message_id,
            ChatMessage.chat_id == chat_id,
        )

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_chat(
        self,
        chat_id: int,
        offset: int = 0,
        limit: int = 100,
    ) -> list[ChatMessage]:
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.chat_id == chat_id)
            .order_by(ChatMessage.created_at)
            .offset(offset)
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_recent_completed_by_chat(
        self,
        chat_id: int,
        limit: int = 20,
    ) -> list[ChatMessage]:
        stmt = (
            select(ChatMessage)
            .where(
                ChatMessage.chat_id == chat_id,
                ChatMessage.status == MessageStatus.COMPLETED,
                ChatMessage.text.is_not(None),
            )
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        messages = list(result.scalars().all())

        return list(reversed(messages))