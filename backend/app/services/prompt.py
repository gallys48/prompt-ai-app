from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.enums import UserRole
from app.models.prompt import Prompt
from app.models.user import User
from app.repositories.prompt import PromptRepository
from app.schemas.prompt import PromptCreate, PromptUpdate


class PromptService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.prompts = PromptRepository(db)

    def _can_manage_prompt(self, prompt: Prompt, current_user: User) -> bool:
        if current_user.role in {UserRole.SUPERUSER, UserRole.ADMIN}:
            return True

        return prompt.user_id == current_user.id

    async def create_prompt(
        self,
        data: PromptCreate,
        current_user: User,
    ) -> Prompt:
        create_data = data.model_dump()
        create_data["user_id"] = current_user.id
        create_data["user_update_id"] = None

        prompt = await self.prompts.create(create_data)

        await self.db.commit()
        await self.db.refresh(prompt)

        return prompt

    async def get_prompt(self, prompt_id: int) -> Prompt:
        prompt = await self.prompts.get_active(prompt_id)

        if not prompt:
            raise NotFoundError("Промпт не найден")

        return prompt

    async def list_prompts(
        self,
        offset: int = 0,
        limit: int = 100,
        search: str | None = None,
        prompt_type: str | None = None,
    ) -> tuple[list[Prompt], int]:
        prompts = await self.prompts.list_active(
            offset=offset,
            limit=limit,
            search=search,
            prompt_type=prompt_type,
        )

        total = await self.prompts.count_active(
            search=search,
            prompt_type=prompt_type,
        )

        return prompts, total

    async def update_prompt(
        self,
        prompt_id: int,
        data: PromptUpdate,
        current_user: User,
    ) -> Prompt:
        prompt = await self.get_prompt(prompt_id)

        if not self._can_manage_prompt(prompt, current_user):
            raise ForbiddenError("Недостаточно прав для изменения промпта")

        update_data = data.model_dump(exclude_unset=True)

        if not update_data:
            return prompt

        update_data["user_update_id"] = current_user.id

        prompt = await self.prompts.update(prompt, update_data)

        await self.db.commit()
        await self.db.refresh(prompt)

        return prompt

    async def soft_delete_prompt(
        self,
        prompt_id: int,
        current_user: User,
    ) -> Prompt:
        prompt = await self.get_prompt(prompt_id)

        if not self._can_manage_prompt(prompt, current_user):
            raise ForbiddenError("Недостаточно прав для удаления промпта")

        prompt = await self.prompts.update(
            prompt,
            {
                "is_active": False,
                "user_update_id": current_user.id,
            },
        )

        await self.db.commit()
        await self.db.refresh(prompt)

        return prompt