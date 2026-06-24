from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole, UserStatus


class UserBase(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    username: str = Field(min_length=3, max_length=20)
    email: EmailStr
    org: str = Field(min_length=1, max_length=255)
    post: str | None = Field(default=None, max_length=255)


class UserRegister(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserCreateInternal(UserBase):
    hashed_password: str
    role: UserRole = UserRole.USER
    status: UserStatus = UserStatus.PENDING
    is_active: bool = False
    image_url: str | None = None


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    username: str | None = Field(default=None, min_length=3, max_length=20)
    email: EmailStr | None = None
    org: str | None = Field(default=None, min_length=1, max_length=255)
    post: str | None = Field(default=None, max_length=255)
    image_url: str | None = Field(default=None, max_length=500)


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserStatusUpdate(BaseModel):
    status: UserStatus
    is_active: bool


class UserRead(BaseModel):
    id: int
    full_name: str
    username: str
    email: EmailStr
    image_url: str | None
    org: str
    post: str | None
    role: UserRole
    status: UserStatus
    is_active: bool
    registered_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)