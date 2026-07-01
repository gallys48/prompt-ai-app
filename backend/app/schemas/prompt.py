from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PromptBase(BaseModel):
    type: str = Field(min_length=1, max_length=100)
    short_description: str = Field(min_length=1, max_length=200)
    text: str = Field(min_length=1)


class PromptCreate(PromptBase):
    pass


class PromptUpdate(BaseModel):
    type: str | None = Field(default=None, min_length=1, max_length=100)
    short_description: str | None = Field(default=None, min_length=1, max_length=200)
    text: str | None = Field(default=None, min_length=1)


class PromptRead(BaseModel):
    id: int
    user_id: int
    user_update_id: int | None
    type: str
    short_description: str
    text: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    creator_username: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PromptListResponse(BaseModel):
    items: list[PromptRead]
    total: int
    offset: int
    limit: int