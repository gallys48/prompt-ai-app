import asyncio

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.enums import UserRole, UserStatus
from app.models.user import User


USERNAME = "admin"
NEW_PASSWORD = "admin12345"


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.username == USERNAME)
        )

        user = result.scalar_one_or_none()

        if not user:
            print(f"User '{USERNAME}' not found")
            return

        user.hashed_password = hash_password(NEW_PASSWORD)
        user.role = UserRole.ADMIN
        user.status = UserStatus.ACTIVE
        user.is_active = True

        db.add(user)
        await db.commit()

        print(f"Password for '{USERNAME}' changed successfully")
        print(f"New password: {NEW_PASSWORD}")


asyncio.run(main())