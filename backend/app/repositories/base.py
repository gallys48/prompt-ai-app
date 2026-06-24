from typing import Any, Generic, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get(self, obj_id: int) -> ModelType | None:
        return await self.db.get(self.model, obj_id)

    async def list(
        self,
        offset: int = 0,
        limit: int = 100,
    ) -> list[ModelType]:
        stmt = select(self.model).offset(offset).limit(limit)

        result = await self.db.execute(stmt)

        return list(result.scalars().all())

    async def create(self, data: dict[str, Any]) -> ModelType:
        obj = self.model(**data)

        self.db.add(obj)

        await self.db.flush()
        await self.db.refresh(obj)

        return obj

    async def update(
        self,
        obj: ModelType,
        data: dict[str, Any],
    ) -> ModelType:
        for field, value in data.items():
            setattr(obj, field, value)

        self.db.add(obj)

        await self.db.flush()
        await self.db.refresh(obj)

        return obj

    async def delete(self, obj: ModelType) -> None:
        await self.db.delete(obj)
        await self.db.flush()