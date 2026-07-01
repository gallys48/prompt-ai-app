from httpx import AsyncClient

from app.models.enums import UserStatus


def auth_headers(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
    }


def get_set_cookie_headers(response) -> list[str]:
    return response.headers.get_list("set-cookie")


def assert_auth_cookies_are_set(response) -> None:
    set_cookie_headers = get_set_cookie_headers(response)

    assert any("access_token=" in header for header in set_cookie_headers)
    assert any("refresh_token=" in header for header in set_cookie_headers)

    assert any(
        "access_token=" in header and "HttpOnly" in header
        for header in set_cookie_headers
    )
    assert any(
        "refresh_token=" in header and "HttpOnly" in header
        for header in set_cookie_headers
    )


def assert_auth_cookies_are_deleted(response) -> None:
    set_cookie_headers = get_set_cookie_headers(response)

    assert any(
        "access_token=" in header and "Max-Age=0" in header
        for header in set_cookie_headers
    )
    assert any(
        "refresh_token=" in header and "Max-Age=0" in header
        for header in set_cookie_headers
    )


async def test_register_creates_pending_user(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Test User",
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123",
            "org": "Test Org",
            "post": "Developer",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["full_name"] == "Test User"
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert data["org"] == "Test Org"
    assert data["post"] == "Developer"
    assert data["status"] == UserStatus.PENDING.value
    assert data["is_active"] is False
    assert "password" not in data
    assert "hashed_password" not in data


async def test_pending_user_cannot_login(client: AsyncClient):
    register_response = await client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Pending User",
            "username": "pendinguser",
            "email": "pending@example.com",
            "password": "password123",
            "org": "Pending Org",
            "post": "Analyst",
        },
    )

    assert register_response.status_code == 201

    response = await client.post(
        "/api/v1/auth/login",
        json={
            "login": "pendinguser",
            "password": "password123",
        },
    )

    assert response.status_code in {400, 401, 403}

    assert client.cookies.get("access_token") is None
    assert client.cookies.get("refresh_token") is None


async def test_active_user_can_login_and_get_tokens_in_body(
    client: AsyncClient,
    active_user,
):
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "login": active_user.username,
            "password": "password123",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "user" in data
    assert "tokens" in data

    assert data["user"]["id"] == active_user.id
    assert data["user"]["username"] == active_user.username

    assert "access_token" in data["tokens"]
    assert "refresh_token" in data["tokens"]
    assert data["tokens"]["token_type"] == "bearer"


async def test_login_sets_http_only_cookies(
    client: AsyncClient,
    active_user,
):
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "login": active_user.username,
            "password": "password123",
        },
    )

    assert response.status_code == 200

    assert_auth_cookies_are_set(response)

    assert client.cookies.get("access_token") is not None
    assert client.cookies.get("refresh_token") is not None


async def test_get_me_with_bearer_token_still_works(
    client: AsyncClient,
    active_user,
):
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "login": active_user.username,
            "password": "password123",
        },
    )

    assert login_response.status_code == 200

    access_token = login_response.json()["tokens"]["access_token"]

    response = await client.get(
        "/api/v1/users/me",
        headers=auth_headers(access_token),
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == active_user.id
    assert data["username"] == active_user.username
    assert data["email"] == active_user.email


async def test_get_me_with_cookie_auth(
    client: AsyncClient,
    active_user,
):
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "login": active_user.username,
            "password": "password123",
        },
    )

    assert login_response.status_code == 200

    response = await client.get("/api/v1/users/me")

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == active_user.id
    assert data["username"] == active_user.username
    assert data["email"] == active_user.email


async def test_get_me_without_auth_returns_401(client: AsyncClient):
    response = await client.get("/api/v1/users/me")

    assert response.status_code == 401


async def test_wrong_password_returns_error(
    client: AsyncClient,
    active_user,
):
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "login": active_user.username,
            "password": "wrong-password",
        },
    )

    assert response.status_code in {400, 401}

    assert client.cookies.get("access_token") is None
    assert client.cookies.get("refresh_token") is None


async def test_refresh_with_body_still_works(
    client: AsyncClient,
    active_user,
):
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "login": active_user.username,
            "password": "password123",
        },
    )

    assert login_response.status_code == 200

    refresh_token = login_response.json()["tokens"]["refresh_token"]

    response = await client.post(
        "/api/v1/auth/refresh",
        json={
            "refresh_token": refresh_token,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

    assert_auth_cookies_are_set(response)


async def test_refresh_with_cookie_auth(
    client: AsyncClient,
    active_user,
):
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "login": active_user.username,
            "password": "password123",
        },
    )

    assert login_response.status_code == 200
    assert client.cookies.get("refresh_token") is not None

    response = await client.post("/api/v1/auth/refresh")

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

    assert_auth_cookies_are_set(response)


async def test_refresh_without_token_returns_401(client: AsyncClient):
    response = await client.post("/api/v1/auth/refresh")

    assert response.status_code == 401


async def test_logout_with_cookie_auth_deletes_cookies(
    client: AsyncClient,
    active_user,
):
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "login": active_user.username,
            "password": "password123",
        },
    )

    assert login_response.status_code == 200

    assert client.cookies.get("access_token") is not None
    assert client.cookies.get("refresh_token") is not None

    response = await client.post("/api/v1/auth/logout")

    assert response.status_code == 200

    data = response.json()

    assert data["detail"] == "Logged out"

    assert_auth_cookies_are_deleted(response)

    assert client.cookies.get("access_token") is None
    assert client.cookies.get("refresh_token") is None


async def test_logout_with_body_still_works(
    client: AsyncClient,
    active_user,
):
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "login": active_user.username,
            "password": "password123",
        },
    )

    assert login_response.status_code == 200

    refresh_token = login_response.json()["tokens"]["refresh_token"]

    response = await client.post(
        "/api/v1/auth/logout",
        json={
            "refresh_token": refresh_token,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["detail"] == "Logged out"

    assert_auth_cookies_are_deleted(response)


async def test_get_me_after_logout_returns_401(
    client: AsyncClient,
    active_user,
):
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "login": active_user.username,
            "password": "password123",
        },
    )

    assert login_response.status_code == 200

    me_response = await client.get("/api/v1/users/me")
    assert me_response.status_code == 200

    logout_response = await client.post("/api/v1/auth/logout")
    assert logout_response.status_code == 200

    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401