from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin, get_current_user
from app.db.session import get_db
from app.models.enums import UserRole, UserStatus
from app.models.user import User
from app.schemas.user import (
    UserRead,
    UserRoleUpdate,
    UserStatusUpdate,
    UserUpdate,
)
from app.services.user import UserService

router = APIRouter(tags=["users"])


@router.get("/users/me", response_model=UserRead)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.patch("/users/me", response_model=UserRead)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)

    return await service.update_user(
        user_id=current_user.id,
        data=data,
    )


@router.get("/admin/users", response_model=list[UserRead])
async def list_users(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)

    return await service.users.list_users(
        offset=offset,
        limit=limit,
    )


@router.get("/admin/users/{user_id}", response_model=UserRead)
async def get_user_by_admin(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)

    return await service.get_user(user_id)


@router.patch("/admin/users/{user_id}/approve", response_model=UserRead)
async def approve_user(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)

    return await service.change_status(
        user_id=user_id,
        status=UserStatus.ACTIVE,
        is_active=True,
    )


@router.patch("/admin/users/{user_id}/role", response_model=UserRead)
async def change_user_role(
    user_id: int,
    data: UserRoleUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)

    return await service.change_role(
        user_id=user_id,
        role=data.role,
    )


@router.patch("/admin/users/{user_id}/status", response_model=UserRead)
async def change_user_status(
    user_id: int,
    data: UserStatusUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)

    return await service.change_status(
        user_id=user_id,
        status=data.status,
        is_active=data.is_active,
    )


@router.delete(
    "/admin/users/{user_id}",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
)
async def delete_user(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)

    return await service.soft_delete_user(user_id)