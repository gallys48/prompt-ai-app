import asyncio
from datetime import datetime

from app.db.session import AsyncSessionLocal
from app.models.enums import MessageStatus, UserStatus
from app.schemas.chat import ChatCreate
from app.schemas.prompt import PromptCreate
from app.schemas.user import UserCreateInternal
from app.services.chat import ChatService
from app.services.chat_message import ChatMessageService
from app.services.prompt import PromptService
from app.services.user import UserService


async def main() -> None:
    async with AsyncSessionLocal() as db:
        suffix = int(datetime.now().timestamp())

        user_service = UserService(db)
        prompt_service = PromptService(db)
        chat_service = ChatService(db)
        message_service = ChatMessageService(db)

        user = await user_service.create_user(
            UserCreateInternal(
                full_name="Тестовый Пользователь",
                username=f"test_user_{suffix}",
                email=f"test_{suffix}@example.com",
                org="Тестовая организация",
                post="Разработчик",
                hashed_password="hashed_password_stub",
                status=UserStatus.ACTIVE,
                is_active=True,
            )
        )

        prompt = await prompt_service.create_prompt(
            PromptCreate(
                type="SQL",
                short_description="Проверка дублей",
                text="Найди дубли в таблице users по email.",
            ),
            creator_id=user.id,
        )

        chat = await chat_service.create_chat(
            ChatCreate(title="Тестовый чат"),
            user_id=user.id,
        )

        user_message = await message_service.create_user_message(
            chat_id=chat.id,
            user_id=user.id,
            text=prompt.text,
        )

        assistant_message = await message_service.create_assistant_message(
            chat_id=chat.id,
            text="Это тестовый ответ assistant без GigaChat.",
            status=MessageStatus.COMPLETED,
        )

        print("OK: async-слой БД работает")
        print(f"User ID: {user.id}")
        print(f"Prompt ID: {prompt.id}")
        print(f"Chat ID: {chat.id}")
        print(f"User message ID: {user_message.id}")
        print(f"Assistant message ID: {assistant_message.id}")


if __name__ == "__main__":
    asyncio.run(main())