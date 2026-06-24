from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.prompt import Prompt
from app.repositories.prompt import PromptRepository
from app.schemas.prompt import PromptCreate, PromptUpdate


class PromptService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.prompts = PromptRepository(db)

    async def create_prompt(
        self,
        data: PromptCreate,
        creator_id: int,
    ) -> Prompt:
        create_data = data.model_dump()
        create_data["user_id"] = creator_id

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
    ) -> list[Prompt]:
        return await self.prompts.list_active(
            offset=offset,
            limit=limit,
            search=search,
            prompt_type=prompt_type,
        )

    async def update_prompt(
        self,
        prompt_id: int,
        data: PromptUpdate,
        updater_id: int,
    ) -> Prompt:
        prompt = await self.get_prompt(prompt_id)

        update_data = data.model_dump(exclude_unset=True)
        update_data["user_update_id"] = updater_id

        prompt = await self.prompts.update(prompt, update_data)

        await self.db.commit()
        await self.db.refresh(prompt)

        return prompt

    async def soft_delete_prompt(
        self,
        prompt_id: int,
        updater_id: int,
    ) -> Prompt:
        prompt = await self.get_prompt(prompt_id)

        prompt = await self.prompts.update(
            prompt,
            {
                "is_active": False,
                "user_update_id": updater_id,
            },
        )

        await self.db.commit()
        await self.db.refresh(prompt)

        return prompt