from fastapi import APIRouter, Body, Cookie, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.cookies import delete_auth_cookies, set_auth_cookies
from app.core.exceptions import UnauthorizedError
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    ChangePasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    TokenPair,
)
from app.schemas.user import UserRead, UserRegister
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    data: UserRegister,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    return await service.register(data)


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)

    user, tokens = await service.login(
        login=payload.login,
        password=payload.password,
    )

    set_auth_cookies(
        response=response,
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
    )

    return AuthResponse(
        user=user,
        tokens=tokens,
    )


@router.post("/refresh", response_model=TokenPair)
async def refresh(
    response: Response,
    payload: RefreshTokenRequest | None = Body(default=None),
    refresh_token_cookie: str | None = Cookie(
        default=None,
        alias=settings.REFRESH_TOKEN_COOKIE_NAME,
    ),
    db: AsyncSession = Depends(get_db),
):
    refresh_token: str | None = None

    if payload is not None:
        refresh_token = payload.refresh_token
    elif refresh_token_cookie is not None:
        refresh_token = refresh_token_cookie

    if refresh_token is None:
        raise UnauthorizedError("Refresh token is missing")

    service = AuthService(db)

    tokens = await service.refresh_tokens(refresh_token)

    set_auth_cookies(
        response=response,
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
    )

    return tokens


@router.post("/logout")
async def logout(
    response: Response,
    payload: LogoutRequest | None = Body(default=None),
    refresh_token_cookie: str | None = Cookie(
        default=None,
        alias=settings.REFRESH_TOKEN_COOKIE_NAME,
    ),
    db: AsyncSession = Depends(get_db),
):
    refresh_token: str | None = None

    if payload is not None:
        refresh_token = payload.refresh_token
    elif refresh_token_cookie is not None:
        refresh_token = refresh_token_cookie

    service = AuthService(db)

    if refresh_token is not None:
        await service.logout(refresh_token)

    delete_auth_cookies(response)

    return {"detail": "Logged out"}


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)

    await service.change_password(
        user=current_user,
        old_password=data.old_password,
        new_password=data.new_password,
    )