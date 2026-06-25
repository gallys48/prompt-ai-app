from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.prompt import (
    PromptCreate,
    PromptListResponse,
    PromptRead,
    PromptUpdate,
)
from app.services.prompt import PromptService

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.post(
    "",
    response_model=PromptRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_prompt(
    data: PromptCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PromptService(db)

    return await service.create_prompt(
        data=data,
        current_user=current_user,
    )


@router.get(
    "",
    response_model=PromptListResponse,
)
async def list_prompts(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None, min_length=1),
    prompt_type: str | None = Query(default=None, min_length=1, max_length=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PromptService(db)

    prompts, total = await service.list_prompts(
        offset=offset,
        limit=limit,
        search=search,
        prompt_type=prompt_type,
    )

    return PromptListResponse(
        items=prompts,
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get(
    "/{prompt_id}",
    response_model=PromptRead,
)
async def get_prompt(
    prompt_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PromptService(db)

    return await service.get_prompt(prompt_id)


@router.patch(
    "/{prompt_id}",
    response_model=PromptRead,
)
async def update_prompt(
    prompt_id: int,
    data: PromptUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PromptService(db)

    return await service.update_prompt(
        prompt_id=prompt_id,
        data=data,
        current_user=current_user,
    )


@router.delete(
    "/{prompt_id}",
    response_model=PromptRead,
    status_code=status.HTTP_200_OK,
)
async def delete_prompt(
    prompt_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PromptService(db)

    return await service.soft_delete_prompt(
        prompt_id=prompt_id,
        current_user=current_user,
    )