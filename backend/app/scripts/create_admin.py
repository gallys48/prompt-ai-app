import asyncio

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.enums import UserRole, UserStatus
from app.repositories.user import UserRepository
from app.schemas.user import UserCreateInternal
from app.services.user import UserService


async def main() -> None:
    async with AsyncSessionLocal() as db:
        users = UserRepository(db)

        existing_by_email = await users.get_by_email(settings.FIRST_ADMIN_EMAIL)
        existing_by_username = await users.get_by_username(settings.FIRST_ADMIN_USERNAME)

        if existing_by_email or existing_by_username:
            print("Admin already exists")
            return

        service = UserService(db)

        admin = await service.create_user(
            UserCreateInternal(
                full_name=settings.FIRST_ADMIN_FULL_NAME,
                username=settings.FIRST_ADMIN_USERNAME,
                email=settings.FIRST_ADMIN_EMAIL,
                org=settings.FIRST_ADMIN_ORG,
                post="Администратор",
                hashed_password=hash_password(settings.FIRST_ADMIN_PASSWORD),
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE,
                is_active=True,
            )
        )

        print("Admin created")
        print(f"ID: {admin.id}")
        print(f"Username: {admin.username}")
        print(f"Email: {admin.email}")


if __name__ == "__main__":
    asyncio.run(main())