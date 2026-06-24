from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import UserStatus
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)

        result = await self.db.execute(stmt)

        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        stmt = select(User).where(User.username == username)

        result = await self.db.execute(stmt)

        return result.scalar_one_or_none()

    async def list_users(
        self,
        offset: int = 0,
        limit: int = 100,
        include_deleted: bool = False,
    ) -> list[User]:
        stmt = select(User)

        if not include_deleted:
            stmt = stmt.where(User.status != UserStatus.DELETED)

        stmt = (
            stmt
            .order_by(User.registered_at.desc())
            .offset(offset)
            .limit(limit)
        )

        result = await self.db.execute(stmt)

        return list(result.scalars().all())