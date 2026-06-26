from httpx import AsyncClient

from tests.conftest import auth_headers


async def test_register_creates_pending_user(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Иван Тестовый",
            "username": "ivan",
            "email": "ivan@example.com",
            "org": "Тестовая организация",
            "post": "Разработчик",
            "password": "password123",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["username"] == "ivan"
    assert data["email"] == "ivan@example.com"
    assert data["role"] == "user"
    assert data["status"] == "pending"
    assert data["is_active"] is False


async def test_pending_user_cannot_login(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Иван Тестовый",
            "username": "ivan",
            "email": "ivan@example.com",
            "org": "Тестовая организация",
            "post": "Разработчик",
            "password": "password123",
        },
    )

    response = await client.post(
        "/api/v1/auth/login",
        json={
            "login": "ivan",
            "password": "password123",
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Регистрация ещё не подтверждена администратором"


async def test_active_user_can_login(client: AsyncClient, active_user):
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "login": "user",
            "password": "password123",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["user"]["username"] == "user"
    assert data["tokens"]["access_token"]
    assert data["tokens"]["refresh_token"]
    assert data["tokens"]["token_type"] == "bearer"


async def test_get_me(client: AsyncClient, user_token: str):
    response = await client.get(
        "/api/v1/users/me",
        headers=auth_headers(user_token),
    )

    assert response.status_code == 200

    data = response.json()

    assert data["username"] == "user"
    assert data["email"] == "user@example.com"


async def test_wrong_password_returns_400(client: AsyncClient, active_user):
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "login": "user",
            "password": "wrong-password",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Неверный логин или пароль"