from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import UserRole, UserStatus, enum_values


if TYPE_CHECKING:
    from app.models.audit_log import AuditLog
    from app.models.chat import Chat
    from app.models.chat_message import ChatMessage
    from app.models.password_reset_token import PasswordResetToken
    from app.models.prompt import Prompt
    from app.models.refresh_session import RefreshSession


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)

    username: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        index=True,
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    org: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    post: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", values_callable=enum_values,),
        nullable=False,
        default=UserRole.USER,
        server_default=UserRole.USER.value,
    )

    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name="user_status", values_callable=enum_values,),
        nullable=False,
        default=UserStatus.PENDING,
        server_default=UserStatus.PENDING.value,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    registered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    prompts_created: Mapped[list["Prompt"]] = relationship(
        "Prompt",
        back_populates="creator",
        foreign_keys="Prompt.user_id",
    )

    prompts_updated: Mapped[list["Prompt"]] = relationship(
        "Prompt",
        back_populates="updater",
        foreign_keys="Prompt.user_update_id",
    )

    chats: Mapped[list["Chat"]] = relationship(
        "Chat",
        back_populates="user",
    )

    messages: Mapped[list["ChatMessage"]] = relationship(
        "ChatMessage",
        back_populates="user",
    )

    refresh_sessions: Mapped[list["RefreshSession"]] = relationship(
        "RefreshSession",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    password_reset_tokens: Mapped[list["PasswordResetToken"]] = relationship(
        "PasswordResetToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    audit_logs: Mapped[list["AuditLog"]] = relationship(
        "AuditLog",
        back_populates="user",
    )