from httpx import AsyncClient

from tests.conftest import auth_headers


async def test_create_prompt(client: AsyncClient, user_token: str):
    response = await client.post(
        "/api/v1/prompts",
        headers=auth_headers(user_token),
        json={
            "type": "SQL",
            "short_description": "Проверка дублей",
            "text": "Найди дубли в таблице users по email.",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["type"] == "SQL"
    assert data["short_description"] == "Проверка дублей"
    assert data["text"] == "Найди дубли в таблице users по email."
    assert data["is_active"] is True


async def test_list_prompts(client: AsyncClient, user_token: str):
    await client.post(
        "/api/v1/prompts",
        headers=auth_headers(user_token),
        json={
            "type": "SQL",
            "short_description": "Проверка дублей",
            "text": "Найди дубли.",
        },
    )

    response = await client.get(
        "/api/v1/prompts",
        headers=auth_headers(user_token),
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 1
    assert data["offset"] == 0
    assert data["limit"] == 20
    assert len(data["items"]) == 1


async def test_search_prompts(client: AsyncClient, user_token: str):
    await client.post(
        "/api/v1/prompts",
        headers=auth_headers(user_token),
        json={
            "type": "SQL",
            "short_description": "Проверка дублей",
            "text": "Найди дубли.",
        },
    )

    response = await client.get(
        "/api/v1/prompts?search=дубли",
        headers=auth_headers(user_token),
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1


async def test_update_own_prompt(client: AsyncClient, user_token: str):
    create_response = await client.post(
        "/api/v1/prompts",
        headers=auth_headers(user_token),
        json={
            "type": "SQL",
            "short_description": "Старое описание",
            "text": "Старый текст.",
        },
    )

    prompt_id = create_response.json()["id"]

    response = await client.patch(
        f"/api/v1/prompts/{prompt_id}",
        headers=auth_headers(user_token),
        json={
            "short_description": "Новое описание",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["short_description"] == "Новое описание"


async def test_user_cannot_update_another_user_prompt(
    client: AsyncClient,
    user_token: str,
    second_user_token: str,
):
    create_response = await client.post(
        "/api/v1/prompts",
        headers=auth_headers(user_token),
        json={
            "type": "SQL",
            "short_description": "Чужой промпт",
            "text": "Текст чужого промпта.",
        },
    )

    prompt_id = create_response.json()["id"]

    response = await client.patch(
        f"/api/v1/prompts/{prompt_id}",
        headers=auth_headers(second_user_token),
        json={
            "short_description": "Попытка изменить",
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Недостаточно прав для изменения промпта"


async def test_admin_can_update_another_user_prompt(
    client: AsyncClient,
    user_token: str,
    admin_token: str,
):
    create_response = await client.post(
        "/api/v1/prompts",
        headers=auth_headers(user_token),
        json={
            "type": "SQL",
            "short_description": "Промпт пользователя",
            "text": "Текст.",
        },
    )

    prompt_id = create_response.json()["id"]

    response = await client.patch(
        f"/api/v1/prompts/{prompt_id}",
        headers=auth_headers(admin_token),
        json={
            "short_description": "Изменено админом",
        },
    )

    assert response.status_code == 200
    assert response.json()["short_description"] == "Изменено админом"


async def test_delete_prompt(client: AsyncClient, user_token: str):
    create_response = await client.post(
        "/api/v1/prompts",
        headers=auth_headers(user_token),
        json={
            "type": "SQL",
            "short_description": "Удаляемый промпт",
            "text": "Текст.",
        },
    )

    prompt_id = create_response.json()["id"]

    delete_response = await client.delete(
        f"/api/v1/prompts/{prompt_id}",
        headers=auth_headers(user_token),
    )

    assert delete_response.status_code == 200
    assert delete_response.json()["is_active"] is False

    get_response = await client.get(
        f"/api/v1/prompts/{prompt_id}",
        headers=auth_headers(user_token),
    )

    assert get_response.status_code == 404