import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.enums import UserRole, UserStatus
from app.models.user import User
from app.core.config import settings


test_engine = create_async_engine(
    settings.async_database_url,
    pool_pre_ping=True,
    poolclass=NullPool,
)

TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    autoflush=False,
    expire_on_commit=False,
)


@pytest.fixture(scope="session", autouse=True)
async def prepare_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await test_engine.dispose()


@pytest.fixture(autouse=True)
async def clean_database():
    async with test_engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(table.delete())

    yield


@pytest.fixture()
async def db_session() -> AsyncSession:
    async with TestSessionLocal() as session:
        yield session


@pytest.fixture()
async def client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as async_client:
        yield async_client

    app.dependency_overrides.clear()


@pytest.fixture()
async def active_user(db_session: AsyncSession) -> User:
    user = User(
        full_name="Обычный Пользователь",
        username="user",
        email="user@example.com",
        org="Тестовая организация",
        post="Разработчик",
        hashed_password=hash_password("password123"),
        role=UserRole.USER,
        status=UserStatus.ACTIVE,
        is_active=True,
    )

    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    return user


@pytest.fixture()
async def second_active_user(db_session: AsyncSession) -> User:
    user = User(
        full_name="Второй Пользователь",
        username="user2",
        email="user2@example.com",
        org="Тестовая организация",
        post="Аналитик",
        hashed_password=hash_password("password123"),
        role=UserRole.USER,
        status=UserStatus.ACTIVE,
        is_active=True,
    )

    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    return user


@pytest.fixture()
async def admin_user(db_session: AsyncSession) -> User:
    user = User(
        full_name="Администратор",
        username="admin",
        email="admin@example.com",
        org="Администрация",
        post="Администратор",
        hashed_password=hash_password("admin12345"),
        role=UserRole.ADMIN,
        status=UserStatus.ACTIVE,
        is_active=True,
    )

    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    return user


async def login_and_get_token(client: AsyncClient, login: str, password: str) -> str:
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "login": login,
            "password": password,
        },
    )

    assert response.status_code == 200

    return response.json()["tokens"]["access_token"]


@pytest.fixture()
async def user_token(client: AsyncClient, active_user: User) -> str:
    return await login_and_get_token(client, "user", "password123")


@pytest.fixture()
async def second_user_token(client: AsyncClient, second_active_user: User) -> str:
    return await login_and_get_token(client, "user2", "password123")


@pytest.fixture()
async def admin_token(client: AsyncClient, admin_user: User) -> str:
    return await login_and_get_token(client, "admin", "admin12345")


def auth_headers(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
    }