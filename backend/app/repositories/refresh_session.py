from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refresh_session import RefreshSession
from app.repositories.base import BaseRepository


class RefreshSessionRepository(BaseRepository[RefreshSession]):
    def __init__(self, db: AsyncSession):
        super().__init__(RefreshSession, db)

    async def get_by_token_hash(self, token_hash: str) -> RefreshSession | None:
        stmt = select(RefreshSession).where(
            RefreshSession.refresh_token_hash == token_hash,
        )

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def revoke(self, session: RefreshSession) -> RefreshSession:
        session.is_revoked = True
        session.revoked_at = datetime.now(UTC)

        self.db.add(session)

        await self.db.flush()
        await self.db.refresh(session)

        return session

    async def revoke_all_by_user_id(self, user_id: int) -> None:
        stmt = select(RefreshSession).where(
            RefreshSession.user_id == user_id,
            RefreshSession.is_revoked.is_(False),
        )

        result = await self.db.execute(stmt)
        sessions = list(result.scalars().all())

        for session in sessions:
            session.is_revoked = True
            session.revoked_at = datetime.now(UTC)
            self.db.add(session)

        await self.db.flush()