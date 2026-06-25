from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.chat import (
    ChatCreate,
    ChatFromPromptCreate,
    ChatFromPromptResponse,
    ChatListResponse,
    ChatRead,
    ChatUpdate,
    ChatWithMessages,
)
from app.schemas.chat_message import (
    ChatMessageRead,
    SendMessageRequest,
    SendMessageResponse,
)
from app.services.chat import ChatService
from app.services.chat_message import ChatMessageService

router = APIRouter(prefix="/chats", tags=["chats"])


@router.post(
    "",
    response_model=ChatRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_chat(
    data: ChatCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)

    return await service.create_chat(
        data=data,
        current_user=current_user,
    )


@router.post(
    "/from-prompt/{prompt_id}",
    response_model=ChatFromPromptResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_chat_from_prompt(
    prompt_id: int,
    data: ChatFromPromptCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)

    chat, user_message, assistant_message = await service.create_chat_from_prompt(
        prompt_id=prompt_id,
        current_user=current_user,
        title=data.title,
    )

    return ChatFromPromptResponse(
        chat=chat,
        user_message=user_message,
        assistant_message=assistant_message,
    )


@router.get(
    "",
    response_model=ChatListResponse,
)
async def list_chats(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)

    chats, total = await service.list_chats(
        current_user=current_user,
        offset=offset,
        limit=limit,
    )

    return ChatListResponse(
        items=chats,
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get(
    "/{chat_id}",
    response_model=ChatWithMessages,
)
async def get_chat(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)

    return await service.get_chat(
        chat_id=chat_id,
        current_user=current_user,
    )


@router.patch(
    "/{chat_id}",
    response_model=ChatRead,
)
async def update_chat(
    chat_id: int,
    data: ChatUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)

    return await service.update_chat(
        chat_id=chat_id,
        current_user=current_user,
        data=data,
    )


@router.delete(
    "/{chat_id}",
    response_model=ChatRead,
    status_code=status.HTTP_200_OK,
)
async def delete_chat(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)

    return await service.soft_delete_chat(
        chat_id=chat_id,
        current_user=current_user,
    )


@router.post(
    "/{chat_id}/messages",
    response_model=SendMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    chat_id: int,
    data: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChatMessageService(db)

    user_message, assistant_message = await service.send_message_to_gigachat(
        chat_id=chat_id,
        current_user=current_user,
        text=data.text,
    )

    return SendMessageResponse(
        user_message=user_message,
        assistant_message=assistant_message,
    )

@router.get(
    "/{chat_id}/messages/{message_id}",
    response_model=ChatMessageRead,
)
async def get_message(
    chat_id: int,
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChatMessageService(db)

    return await service.get_message(
        chat_id=chat_id,
        message_id=message_id,
        current_user=current_user,
    )


@router.post(
    "/{chat_id}/messages/{message_id}/retry",
    response_model=ChatMessageRead,
    status_code=status.HTTP_202_ACCEPTED,
)
async def retry_failed_message(
    chat_id: int,
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChatMessageService(db)

    return await service.retry_failed_assistant_message(
        chat_id=chat_id,
        message_id=message_id,
        current_user=current_user,
    )