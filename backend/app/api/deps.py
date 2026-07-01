from collections.abc import Callable

from fastapi import Cookie, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_token
from app.db.session import get_db
from app.models.enums import UserRole, UserStatus
from app.models.user import User
from app.repositories.user import UserRepository

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    access_token_cookie: str | None = Cookie(
        default=None,
        alias=settings.ACCESS_TOKEN_COOKIE_NAME,
    ),
    db: AsyncSession = Depends(get_db),
) -> User:
    token: str | None = None

    if credentials is not None:
        token = credentials.credentials
    elif access_token_cookie is not None:
        token = access_token_cookie

    if token is None:
        raise UnauthorizedError("Не передан access token")

    payload = decode_token(token)

    if not payload:
        raise UnauthorizedError("Недействительный access token")

    if payload.get("type") != "access":
        raise UnauthorizedError("Некорректный тип токена")

    user_id_raw = payload.get("sub")

    if not user_id_raw:
        raise UnauthorizedError("Некорректный access token")

    try:
        user_id = int(user_id_raw)
    except ValueError:
        raise UnauthorizedError("Некорректный user id в токене")

    users = UserRepository(db)
    user = await users.get(user_id)

    if not user:
        raise UnauthorizedError("Пользователь не найден")

    if not user.is_active or user.status != UserStatus.ACTIVE:
        raise ForbiddenError("Пользователь не активен")

    return user


def require_roles(*roles: UserRole) -> Callable:
    async def dependency(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in roles:
            raise ForbiddenError("Недостаточно прав")

        return current_user

    return dependency


async def get_current_admin(
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> User:
    return current_user


async def get_current_superuser_or_admin(
    current_user: User = Depends(
        require_roles(UserRole.SUPERUSER, UserRole.ADMIN),
    ),
) -> User:
    return current_user