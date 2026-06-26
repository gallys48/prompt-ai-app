# Prompt AI App

Backend-сервис для сайта промптов и ИИ-чата.

Проект позволяет пользователям регистрироваться, проходить подтверждение администратором, создавать промпты, запускать чаты на основе промптов и получать ответы от GigaChat через фоновую очередь задач.

## Стек

- Python 3.12
- FastAPI
- PostgreSQL
- SQLAlchemy Async
- Alembic
- RabbitMQ
- Celery
- GigaChat API
- JWT auth
- Docker Compose
- Pytest

## Архитектура

```text
Frontend / Swagger
        ↓
FastAPI backend
        ↓
PostgreSQL

FastAPI backend
        ↓
RabbitMQ
        ↓
Celery worker
        ↓
GigaChat API
        ↓
PostgreSQL
```

Основная идея: backend быстро принимает HTTP-запрос, сохраняет сообщение пользователя и создаёт assistant-сообщение со статусом `pending`. После этого Celery worker в фоне обращается к GigaChat и обновляет assistant-сообщение в БД.

## Основные возможности

- регистрация пользователя;
- подтверждение пользователя администратором;
- JWT access/refresh авторизация;
- refresh-сессии в БД;
- роли `user`, `superuser`, `admin`;
- CRUD промптов;
- CRUD чатов;
- отправка сообщений в чат;
- фоновая генерация ответа через RabbitMQ/Celery;
- интеграция с GigaChat API;
- retry failed assistant-сообщений;
- request_id для HTTP-запросов;
- файловые логи с ротацией;
- backend-тесты.

## Запуск проекта

Создай `.env` в корне проекта на основе `.env.example`.

Запуск:

```bash
docker compose up --build
```

Swagger:

```text
http://localhost:8000/docs
```

RabbitMQ UI:

```text
http://localhost:15672
```

## Миграции

Применить миграции:

```bash
docker compose exec backend alembic upgrade head
```

Создать новую миграцию:

```bash
docker compose exec backend alembic revision --autogenerate -m "migration name"
```

## Создание первого администратора

```bash
docker compose exec backend python -m app.scripts.create_admin
```

После этого можно войти через:

```json
{
  "login": "admin",
  "password": "admin12345"
}
```

Данные администратора задаются через `.env`.

## Тесты

Запуск всех тестов:

```bash
docker compose --profile test run --rm backend_tests
```

Запуск отдельных тестов:

```bash
docker compose --profile test run --rm backend_tests pytest tests/test_auth.py -q
docker compose --profile test run --rm backend_tests pytest tests/test_prompts.py -q
docker compose --profile test run --rm backend_tests pytest tests/test_chats.py -q
```

## Логи

Логи backend:

```bash
docker compose logs -f backend
```

Логи Celery worker:

```bash
docker compose logs -f celery_worker
```

Файловые логи:

```text
backend/logs/app.log
backend/logs/error.log
```

`app.log` содержит обычные события приложения.  
`error.log` содержит ошибки уровня `ERROR` и выше.

## Основные API-разделы

### Auth

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/change-password
```

### Users

```text
GET    /api/v1/users/me
PATCH  /api/v1/users/me

GET    /api/v1/admin/users
GET    /api/v1/admin/users/{user_id}
PATCH  /api/v1/admin/users/{user_id}/approve
PATCH  /api/v1/admin/users/{user_id}/role
PATCH  /api/v1/admin/users/{user_id}/status
DELETE /api/v1/admin/users/{user_id}
```

### Prompts

```text
POST   /api/v1/prompts
GET    /api/v1/prompts
GET    /api/v1/prompts/{prompt_id}
PATCH  /api/v1/prompts/{prompt_id}
DELETE /api/v1/prompts/{prompt_id}
```

### Chats

```text
POST   /api/v1/chats
POST   /api/v1/chats/from-prompt/{prompt_id}
GET    /api/v1/chats
GET    /api/v1/chats/{chat_id}
PATCH  /api/v1/chats/{chat_id}
DELETE /api/v1/chats/{chat_id}
POST   /api/v1/chats/{chat_id}/messages
GET    /api/v1/chats/{chat_id}/messages/{message_id}
POST   /api/v1/chats/{chat_id}/messages/{message_id}/retry
```

## Статусы сообщений

```text
pending    — assistant-сообщение создано, задача поставлена в очередь
processing — worker начал обработку
completed  — ответ успешно получен
failed     — при обработке произошла ошибка
```

## Полезные команды без Makefile

Запуск:

```bash
docker compose up --build
```

Остановка:

```bash
docker compose down
```

Контейнеры:

```bash
docker compose ps
```

Логи:

```bash
docker compose logs -f backend
docker compose logs -f celery_worker
```

Shell backend:

```bash
docker compose exec backend sh
```

PostgreSQL:

```bash
docker compose exec postgres psql -U prompt_ai_user -d prompt_ai_db
```

Тесты:

```bash
docker compose --profile test run --rm backend_tests
```

## Future improvements

- frontend на Next.js;
- разделение dev/prod docker-compose;
- CI/CD;
- Sentry для ошибок;
- Grafana + Loki + Promtail для централизованных логов;
- rate limiting;
- websocket/SSE для live-обновления сообщений;
- расширенные backend-тесты;
- OpenAPI-документация для frontend.
