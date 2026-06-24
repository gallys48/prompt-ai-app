from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.chat_message import ChatMessageRead


class ChatCreate(BaseModel):
    title: str | None = Field(default=None, max_length=255)


class ChatUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)


class ChatRead(BaseModel):
    id: int
    user_id: int
    title: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatWithMessages(ChatRead):
    messages: list[ChatMessageRead] = []