from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.prompt import Prompt
from app.repositories.base import BaseRepository


class PromptRepository(BaseRepository[Prompt]):
    def __init__(self, db: AsyncSession):
        super().__init__(Prompt, db)

    async def get_active(self, prompt_id: int) -> Prompt | None:
        stmt = select(Prompt).where(
            Prompt.id == prompt_id,
            Prompt.is_active.is_(True),
        )

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_active(
        self,
        offset: int = 0,
        limit: int = 100,
        search: str | None = None,
        prompt_type: str | None = None,
    ) -> list[Prompt]:
        stmt = select(Prompt).where(Prompt.is_active.is_(True))

        if search:
            search_pattern = f"%{search}%"

            stmt = stmt.where(
                or_(
                    Prompt.short_description.ilike(search_pattern),
                    Prompt.text.ilike(search_pattern),
                    Prompt.type.ilike(search_pattern),
                )
            )

        if prompt_type:
            stmt = stmt.where(Prompt.type == prompt_type)

        stmt = (
            stmt
            .order_by(desc(Prompt.created_at))
            .offset(offset)
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def count_active(
        self,
        search: str | None = None,
        prompt_type: str | None = None,
    ) -> int:
        stmt = select(func.count(Prompt.id)).where(Prompt.is_active.is_(True))

        if search:
            search_pattern = f"%{search}%"

            stmt = stmt.where(
                or_(
                    Prompt.short_description.ilike(search_pattern),
                    Prompt.text.ilike(search_pattern),
                    Prompt.type.ilike(search_pattern),
                )
            )

        if prompt_type:
            stmt = stmt.where(Prompt.type == prompt_type)

        result = await self.db.execute(stmt)
        return int(result.scalar_one())