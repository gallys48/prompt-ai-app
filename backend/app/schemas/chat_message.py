from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import MessageSenderType, MessageStatus


class ChatMessageCreate(BaseModel):
    text: str = Field(min_length=1)


class ChatMessageRead(BaseModel):
    id: int
    chat_id: int
    user_id: int | None
    sender_type: MessageSenderType
    status: MessageStatus
    gigachat_message_id: str | None
    text: str | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SendMessageRequest(BaseModel):
    text: str = Field(min_length=1)


class SendMessageResponse(BaseModel):
    user_message: ChatMessageRead
    assistant_message: ChatMessageRead