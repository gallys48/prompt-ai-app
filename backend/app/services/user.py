from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.enums import UserRole, UserStatus
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import UserCreateInternal, UserUpdate


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.users = UserRepository(db)

    async def create_user(self, data: UserCreateInternal) -> User:
        existing_email = await self.users.get_by_email(data.email)

        if existing_email:
            raise ConflictError("Пользователь с таким email уже существует")

        existing_username = await self.users.get_by_username(data.username)

        if existing_username:
            raise ConflictError("Пользователь с таким username уже существует")

        user = await self.users.create(data.model_dump())

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def get_user(self, user_id: int) -> User:
        user = await self.users.get(user_id)

        if not user or user.status == UserStatus.DELETED:
            raise NotFoundError("Пользователь не найден")

        return user

    async def update_user(
        self,
        user_id: int,
        data: UserUpdate,
    ) -> User:
        user = await self.get_user(user_id)

        update_data = data.model_dump(exclude_unset=True)

        if "email" in update_data:
            existing = await self.users.get_by_email(update_data["email"])

            if existing and existing.id != user.id:
                raise ConflictError("Пользователь с таким email уже существует")

        if "username" in update_data:
            existing = await self.users.get_by_username(update_data["username"])

            if existing and existing.id != user.id:
                raise ConflictError("Пользователь с таким username уже существует")

        user = await self.users.update(user, update_data)

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def change_role(
        self,
        user_id: int,
        role: UserRole,
    ) -> User:
        user = await self.get_user(user_id)

        user = await self.users.update(user, {"role": role})

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def change_status(
        self,
        user_id: int,
        status: UserStatus,
        is_active: bool,
    ) -> User:
        user = await self.get_user(user_id)

        user = await self.users.update(
            user,
            {
                "status": status,
                "is_active": is_active,
            },
        )

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def soft_delete_user(self, user_id: int) -> User:
        user = await self.get_user(user_id)

        user = await self.users.update(
            user,
            {
                "status": UserStatus.DELETED,
                "is_active": False,
            },
        )

        await self.db.commit()
        await self.db.refresh(user)

        return user