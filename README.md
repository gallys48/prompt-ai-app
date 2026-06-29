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
- backend-тесты;
- dev/prod Docker Compose конфигурация.

## Запуск проекта

### Dev-режим

```bash
docker compose up --build
```

Dev-режим автоматически использует файл:

```text
docker-compose.override.yml
```

В dev-режиме:

```text
backend запускается с --reload
код монтируется через volume ./backend:/app
PostgreSQL доступен с хоста
RabbitMQ UI доступен с хоста
```

Доступы:

```text
Swagger:   http://localhost:8000/docs
RabbitMQ:  http://localhost:15672
```

### Production-like режим

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

В production-like режиме:

```text
backend запускается без --reload
код не монтируется volume-ом
используется код из Docker image
backend запускается с workers
celery запускается с concurrency
```

Это ещё не полноценный production с nginx/https, но уже более близкий к production запуск.

### Остановка

Dev:

```bash
docker compose down
```

Production-like:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

## Docker Compose файлы

```text
docker-compose.yml              — базовая конфигурация
docker-compose.override.yml     — локальная разработка
docker-compose.prod.yml         — production-like запуск
```

Обычный `docker compose up` автоматически применяет `docker-compose.override.yml`.

## Переменные окружения

Создай `.env` в корне проекта на основе `.env.example`.

Пример важных переменных:

```env
APP_ENV=local
LOG_LEVEL=INFO

POSTGRES_DB=prompt_ai_db
POSTGRES_USER=prompt_ai_user
POSTGRES_PASSWORD=change_me
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_HOST_PORT=5434

SECRET_KEY=change_me_use_long_random_secret
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30

RABBITMQ_DEFAULT_USER=prompt_ai
RABBITMQ_DEFAULT_PASS=change_me

CELERY_BROKER_URL=pyamqp://prompt_ai:change_me@rabbitmq:5672//
CELERY_RESULT_BACKEND=rpc://

GIGACHAT_AUTH_KEY=change_me
GIGACHAT_SCOPE=GIGACHAT_API_PERS
GIGACHAT_MODEL=GigaChat
GIGACHAT_VERIFY_SSL=true
GIGACHAT_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
GIGACHAT_TIMEOUT_SECONDS=60
```

Настоящий `.env` нельзя коммитить в Git.

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

Тесты запускаются через Docker Compose profile `test`.

Запуск всех тестов:

```bash
docker compose --profile test run --rm backend_tests
```

Пересборка тестового контейнера:

```bash
docker compose --profile test build backend_tests
```

Запуск отдельных тестов:

```bash
docker compose --profile test run --rm backend_tests pytest tests/test_auth.py -q
docker compose --profile test run --rm backend_tests pytest tests/test_prompts.py -q
docker compose --profile test run --rm backend_tests pytest tests/test_chats.py -q
```

Обычный dev-запуск не поднимает `postgres_test` и `backend_tests`, потому что они находятся в profile `test`.

## Логи

Логи backend:

```bash
docker compose logs -f backend
```

Логи Celery worker:

```bash
docker compose logs -f celery_worker
```

Все логи:

```bash
docker compose logs -f
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

## RabbitMQ

RabbitMQ используется как очередь задач между backend и Celery worker.

Dev UI:

```text
http://localhost:15672
```

Логин и пароль задаются через `.env`:

```env
RABBITMQ_DEFAULT_USER=prompt_ai
RABBITMQ_DEFAULT_PASS=change_me
```

## GigaChat

Для GigaChat нужен ключ авторизации:

```env
GIGACHAT_AUTH_KEY=...
```

SSL-проверка включена:

```env
GIGACHAT_VERIFY_SSL=true
GIGACHAT_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
```

Сертификаты должны лежать в проекте:

```text
backend/certs/russian_trusted_root_ca_pem.crt
backend/certs/russian_trusted_sub_ca_pem.crt
```

И копироваться в Docker image через `backend/Dockerfile`.

## Полезные команды без Makefile

Запуск dev:

```bash
docker compose up --build
```

Запуск production-like:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
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
- nginx + HTTPS;
- Sentry для ошибок;
- Grafana + Loki + Promtail для централизованных логов;
- rate limiting;
- websocket/SSE для live-обновления сообщений;
- расширенные backend-тесты;
- OpenAPI-документация для frontend.
