from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError, ForbiddenError
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    get_refresh_token_expires_at,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.enums import UserRole, UserStatus
from app.models.refresh_session import RefreshSession
from app.models.user import User
from app.repositories.refresh_session import RefreshSessionRepository
from app.repositories.user import UserRepository
from app.schemas.auth import TokenPair
from app.schemas.user import UserCreateInternal, UserRegister


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.users = UserRepository(db)
        self.refresh_sessions = RefreshSessionRepository(db)

    async def register(self, data: UserRegister) -> User:
        if await self.users.get_by_email(data.email):
            raise BadRequestError("Пользователь с таким email уже существует")

        if await self.users.get_by_username(data.username):
            raise BadRequestError("Пользователь с таким username уже существует")

        user_data = UserCreateInternal(
            full_name=data.full_name,
            username=data.username,
            email=data.email,
            org=data.org,
            post=data.post,
            hashed_password=hash_password(data.password),
            role=UserRole.USER,
            status=UserStatus.PENDING,
            is_active=False,
        )

        user = await self.users.create(user_data.model_dump())

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def login(
        self,
        login: str,
        password: str,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> tuple[User, TokenPair]:
        user = await self.users.get_by_email(login)

        if not user:
            user = await self.users.get_by_username(login)

        if not user:
            raise BadRequestError("Неверный логин или пароль")

        if not verify_password(password, user.hashed_password):
            raise BadRequestError("Неверный логин или пароль")

        if user.status == UserStatus.PENDING:
            raise ForbiddenError("Регистрация ещё не подтверждена администратором")

        if user.status == UserStatus.BLOCKED:
            raise ForbiddenError("Пользователь заблокирован")

        if user.status == UserStatus.DELETED:
            raise ForbiddenError("Пользователь удалён")

        if not user.is_active:
            raise ForbiddenError("Пользователь не активен")

        tokens = await self.create_token_pair(
            user=user,
            user_agent=user_agent,
            ip_address=ip_address,
        )

        await self.db.commit()

        return user, tokens

    async def create_token_pair(
        self,
        user: User,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> TokenPair:
        access_token = create_access_token(user.id)
        refresh_token = generate_refresh_token()

        await self.refresh_sessions.create(
            {
                "user_id": user.id,
                "refresh_token_hash": hash_token(refresh_token),
                "user_agent": user_agent,
                "ip_address": ip_address,
                "expires_at": get_refresh_token_expires_at(),
                "is_revoked": False,
            }
        )

        return TokenPair(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    async def refresh_tokens(
        self,
        refresh_token: str,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> TokenPair:
        refresh_token_hash = hash_token(refresh_token)
        session = await self.refresh_sessions.get_by_token_hash(refresh_token_hash)

        if not session:
            raise ForbiddenError("Недействительный refresh token")

        if session.is_revoked:
            raise ForbiddenError("Refresh token отозван")

        if session.expires_at < datetime.now(UTC):
            raise ForbiddenError("Refresh token истёк")

        user = await self.users.get(session.user_id)

        if not user:
            raise ForbiddenError("Пользователь не найден")

        if not user.is_active or user.status != UserStatus.ACTIVE:
            raise ForbiddenError("Пользователь не активен")

        await self.refresh_sessions.revoke(session)

        new_tokens = await self.create_token_pair(
            user=user,
            user_agent=user_agent,
            ip_address=ip_address,
        )

        await self.db.commit()

        return new_tokens

    async def logout(self, refresh_token: str) -> None:
        refresh_token_hash = hash_token(refresh_token)
        session = await self.refresh_sessions.get_by_token_hash(refresh_token_hash)

        if session and not session.is_revoked:
            await self.refresh_sessions.revoke(session)
            await self.db.commit()

    async def change_password(
        self,
        user: User,
        old_password: str,
        new_password: str,
    ) -> None:
        if not verify_password(old_password, user.hashed_password):
            raise BadRequestError("Старый пароль указан неверно")

        user.hashed_password = hash_password(new_password)

        await self.refresh_sessions.revoke_all_by_user_id(user.id)

        self.db.add(user)

        await self.db.commit()