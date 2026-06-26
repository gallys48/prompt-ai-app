# Troubleshooting

## Нет кнопки Authorize в Swagger

Проверь, что в `app/api/deps.py` используется `HTTPBearer`, а не ручное чтение Header.

Правильно:

```python
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer_scheme = HTTPBearer(auto_error=False)
```

## 403 Пользователь не активен

Пользователь зарегистрирован, но ещё не подтверждён администратором.

Нужно вызвать:

```text
PATCH /api/v1/admin/users/{user_id}/approve
```

## Pending пользователь не может войти

Это нормальное поведение.

Новый пользователь получает:

```text
status=pending
is_active=false
```

Войти он сможет только после approve.

## Assistant message висит в pending

Проверь worker:

```bash
docker compose ps
docker compose logs -f celery_worker
```

Проверь RabbitMQ UI:

```text
http://localhost:15672
```

## Assistant message стал failed

Проверь ошибку в БД:

```sql
SELECT id, status, error_message
FROM chat_messages
ORDER BY id DESC;
```

Проверь логи worker:

```bash
docker compose logs -f celery_worker
```

После устранения причины можно вызвать:

```text
POST /api/v1/chats/{chat_id}/messages/{message_id}/retry
```

## SSL certificate verify failed для GigaChat

Проверь `.env`:

```env
GIGACHAT_VERIFY_SSL=true
GIGACHAT_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
```

Проверь, что сертификаты попали в Docker image:

```bash
docker compose exec backend sh
ls -la /usr/local/share/ca-certificates/russian-trusted
```

## Docker не видит certs

Если ошибка:

```text
COPY certs/... not found
```

Проверь, что файлы лежат внутри:

```text
backend/certs/
```

Потому что build context:

```yaml
build:
  context: ./backend
```

## No module named app в тестах

Проверь `backend_tests` в `docker-compose.yml`:

```yaml
working_dir: /app
environment:
  PYTHONPATH: /app
```

Проверь `backend/pytest.ini`:

```ini
pythonpath = .
```

## asyncpg got Future attached to a different loop

Для тестового engine используй `NullPool`:

```python
from sqlalchemy.pool import NullPool

test_engine = create_async_engine(
    settings.async_database_url,
    poolclass=NullPool,
)
```

## Логи не появляются в backend/logs

Проверь volume:

```yaml
volumes:
  - ./backend:/app
  - ./backend/logs:/app/logs
```

Проверь, что `setup_logging()` вызывается в `main.py` и `worker/celery_app.py`.

## Тестовая БД поднимается при обычном запуске

Проверь, что у `postgres_test` и `backend_tests` стоит profile:

```yaml
profiles:
  - test
```

## Docker build падает на скачивании сертификатов

Если ошибка похожа на:

```text
curl ... gu-st.ru ... exit code: 7
```

Не скачивай сертификаты внутри Dockerfile. Положи их локально:

```text
backend/certs/russian_trusted_root_ca_pem.crt
backend/certs/russian_trusted_sub_ca_pem.crt
```

И используй `COPY certs/...` в Dockerfile.

## Проверка, что backend видит env

```bash
docker compose exec backend env
```

Для GigaChat-переменных:

```bash
docker compose exec backend env | grep GIGACHAT
```

## Проверка БД

```bash
docker compose exec postgres psql -U prompt_ai_user -d prompt_ai_db
```

Проверить пользователей:

```sql
SELECT id, username, email, role, status, is_active
FROM users
ORDER BY id;
```

Проверить сообщения:

```sql
SELECT
    id,
    chat_id,
    sender_type,
    status,
    gigachat_message_id,
    left(text, 120) AS text_preview,
    error_message
FROM chat_messages
ORDER BY id DESC;
```

## Очистить тестовую БД

Если тесты ведут себя странно, можно удалить test volume:

```bash
docker compose down
docker volume ls
docker volume rm <project_name>_postgres_test_data
```

Точное имя volume смотри через `docker volume ls`.
