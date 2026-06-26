# Backend architecture

## Layers

Backend разделён на несколько слоёв:

```text
api/router
   ↓
service
   ↓
repository
   ↓
model
   ↓
database
```

## Models

`models` описывают таблицы БД через SQLAlchemy.

Примеры:

```text
User
Prompt
Chat
ChatMessage
RefreshSession
PasswordResetToken
AuditLog
```

## Repositories

`repositories` отвечают за прямую работу с БД:

- получить объект;
- получить список;
- создать;
- обновить;
- удалить;
- выполнить специализированный query.

Репозиторий не должен решать бизнес-логику.

## Services

`services` содержат бизнес-логику:

- проверка прав;
- проверка статусов;
- создание связанных объектов;
- commit транзакций;
- вызов фоновых задач.

Commit делается на уровне service, потому что одна бизнес-операция может включать несколько действий в БД.

## Routers

`api/v1` содержит HTTP endpoints.

Router:

- принимает request;
- валидирует данные через schemas;
- вызывает service;
- возвращает response.

## Schemas

`schemas` — это Pydantic-модели для входящих и исходящих данных API.

## Auth

Авторизация основана на JWT:

- `access_token` используется для доступа к API;
- `refresh_token` используется для получения новой пары токенов;
- refresh token хранится в БД только в виде hash.

## Roles

```text
user       — обычный пользователь
superuser  — расширенные права
admin      — полный доступ к admin endpoints
```

## Message processing

Отправка сообщения работает так:

```text
1. User отправляет сообщение.
2. Backend создаёт user_message со status=completed.
3. Backend создаёт assistant_message со status=pending.
4. Backend отправляет задачу в RabbitMQ.
5. Celery worker берёт задачу.
6. Worker собирает историю чата.
7. Worker отправляет запрос в GigaChat.
8. Worker обновляет assistant_message:
   status=completed
   text=response
```

Если возникает ошибка:

```text
status=failed
error_message=...
```

Для failed-сообщений есть retry endpoint.

## Database layer

В проекте используется асинхронный SQLAlchemy:

- `AsyncSession`;
- `asyncpg`;
- `create_async_engine`;
- `async_sessionmaker`.

Alembic остаётся синхронным и использует `postgresql+psycopg`.

## Transactions

Общее правило:

```text
repository — делает запросы
service    — решает бизнес-логику и делает commit
router     — работает с HTTP
```

Так проще контролировать атомарность операций.

Например, отправка сообщения включает:

```text
1. создать user_message
2. создать assistant_message
3. обновить chat.updated_at
4. commit
5. отправить Celery task
```

## Background jobs

Фоновая обработка сообщений построена через:

```text
FastAPI → RabbitMQ → Celery worker → GigaChat → PostgreSQL
```

FastAPI не ждёт ответ GigaChat в HTTP-запросе. Он сразу возвращает `pending` assistant-сообщение.

## Logging

Для каждого HTTP-запроса создаётся `request_id`.

Логи пишутся:

```text
stdout/stderr Docker
backend/logs/app.log
backend/logs/error.log
```

`app.log` содержит общие события.  
`error.log` содержит ошибки уровня `ERROR` и выше.

Позже можно добавить централизованные логи через Grafana + Loki + Promtail.
