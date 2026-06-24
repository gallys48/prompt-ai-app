from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, Enum, ForeignKey, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import AuditActionType, enum_values

if TYPE_CHECKING:
    from app.models.user import User


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    action: Mapped[AuditActionType] = mapped_column(
        Enum(AuditActionType, name="audit_action_type", values_callable=enum_values,),
        nullable=False,
        index=True,
    )

    entity_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    entity_id: Mapped[int | None] = mapped_column(
        nullable=True,
        index=True,
    )

    details: Mapped[dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
    )

    ip_address: Mapped[str | None] = mapped_column(
        String(45),
        nullable=True,
    )

    user_agent: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    user: Mapped["User | None"] = relationship(
        "User",
        back_populates="audit_logs",
    )