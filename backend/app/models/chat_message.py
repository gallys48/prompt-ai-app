from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import MessageSenderType, MessageStatus, enum_values

if TYPE_CHECKING:
    from app.models.chat import Chat
    from app.models.user import User


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    chat_id: Mapped[int] = mapped_column(
        ForeignKey("chats.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    sender_type: Mapped[MessageSenderType] = mapped_column(
        Enum(MessageSenderType, name="message_sender_type", values_callable=enum_values,),
        nullable=False,
    )

    status: Mapped[MessageStatus] = mapped_column(
        Enum(MessageStatus, name="message_status", values_callable=enum_values,),
        nullable=False,
        default=MessageStatus.COMPLETED,
        server_default=MessageStatus.COMPLETED.value,
        index=True,
    )

    gigachat_message_id: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    chat: Mapped["Chat"] = relationship(
        "Chat",
        back_populates="messages",
    )

    user: Mapped["User | None"] = relationship(
        "User",
        back_populates="messages",
    )