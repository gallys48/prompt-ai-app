from httpx import AsyncClient

from tests.conftest import auth_headers


async def test_create_chat(client: AsyncClient, user_token: str):
    response = await client.post(
        "/api/v1/chats",
        headers=auth_headers(user_token),
        json={
            "title": "Тестовый чат",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["title"] == "Тестовый чат"
    assert data["is_active"] is True


async def test_list_chats(client: AsyncClient, user_token: str):
    await client.post(
        "/api/v1/chats",
        headers=auth_headers(user_token),
        json={
            "title": "Первый чат",
        },
    )

    response = await client.get(
        "/api/v1/chats",
        headers=auth_headers(user_token),
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["title"] == "Первый чат"


async def test_get_chat_with_messages(client: AsyncClient, user_token: str):
    create_response = await client.post(
        "/api/v1/chats",
        headers=auth_headers(user_token),
        json={
            "title": "Чат с сообщениями",
        },
    )

    chat_id = create_response.json()["id"]

    response = await client.get(
        f"/api/v1/chats/{chat_id}",
        headers=auth_headers(user_token),
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == chat_id
    assert data["messages"] == []


async def test_user_cannot_get_another_user_chat(
    client: AsyncClient,
    user_token: str,
    second_user_token: str,
):
    create_response = await client.post(
        "/api/v1/chats",
        headers=auth_headers(user_token),
        json={
            "title": "Чужой чат",
        },
    )

    chat_id = create_response.json()["id"]

    response = await client.get(
        f"/api/v1/chats/{chat_id}",
        headers=auth_headers(second_user_token),
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Чат не найден"


async def test_update_chat(client: AsyncClient, user_token: str):
    create_response = await client.post(
        "/api/v1/chats",
        headers=auth_headers(user_token),
        json={
            "title": "Старое название",
        },
    )

    chat_id = create_response.json()["id"]

    response = await client.patch(
        f"/api/v1/chats/{chat_id}",
        headers=auth_headers(user_token),
        json={
            "title": "Новое название",
        },
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Новое название"


async def test_delete_chat(client: AsyncClient, user_token: str):
    create_response = await client.post(
        "/api/v1/chats",
        headers=auth_headers(user_token),
        json={
            "title": "Удаляемый чат",
        },
    )

    chat_id = create_response.json()["id"]

    delete_response = await client.delete(
        f"/api/v1/chats/{chat_id}",
        headers=auth_headers(user_token),
    )

    assert delete_response.status_code == 200
    assert delete_response.json()["is_active"] is False

    get_response = await client.get(
        f"/api/v1/chats/{chat_id}",
        headers=auth_headers(user_token),
    )

    assert get_response.status_code == 404


async def test_send_message_creates_pending_assistant_message(
    client: AsyncClient,
    user_token: str,
):
    create_response = await client.post(
        "/api/v1/chats",
        headers=auth_headers(user_token),
        json={
            "title": "Чат для сообщения",
        },
    )

    chat_id = create_response.json()["id"]

    response = await client.post(
        f"/api/v1/chats/{chat_id}/messages",
        headers=auth_headers(user_token),
        json={
            "text": "Привет",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["user_message"]["sender_type"] == "user"
    assert data["user_message"]["status"] == "completed"
    assert data["user_message"]["text"] == "Привет"

    assert data["assistant_message"]["sender_type"] == "assistant"
    assert data["assistant_message"]["status"] == "pending"
    assert data["assistant_message"]["text"] is None