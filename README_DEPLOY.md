# Deploy Prompt AI App

Инструкция по запуску проекта на production-сервере через Docker Compose.

## Текущая схема запуска

Проект запускается отдельно от Nextcloud.

```text
SERVER_IP:8081 -> nginx проекта -> frontend/backend
```

Порт `80` на сервере уже может быть занят другим проектом, например Nextcloud.  
Поэтому nginx этого проекта публикуется наружу через порт `8081`.

---

## 1. Подготовка сервера

Установить Docker, Docker Compose plugin, Git и базовые утилиты:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git curl nano
sudo systemctl enable docker
sudo systemctl start docker
```

Проверить установку:

```bash
docker --version
docker compose version
```

---

## 2. Клонирование проекта

Перейти в `/opt`:

```bash
cd /opt
```

Клонировать репозиторий:

```bash
git clone https://github.com/USERNAME/prompt-ai-app.git
cd prompt-ai-app
```

Если репозиторий приватный и используется SSH:

```bash
git clone git@github.com:USERNAME/prompt-ai-app.git
cd prompt-ai-app
```

> Заменить `USERNAME` на имя владельца репозитория.

---

## 3. Создание `.env`

Создать `.env` из шаблона:

```bash
cp .env.example .env
nano .env
```

Минимально нужно заменить следующие значения:

```env
POSTGRES_PASSWORD=CHANGE_ME_STRONG_DB_PASSWORD
RABBITMQ_DEFAULT_PASS=CHANGE_ME_STRONG_RABBIT_PASSWORD
CELERY_BROKER_URL=amqp://prompt_ai:CHANGE_ME_STRONG_RABBIT_PASSWORD@rabbitmq:5672//
SECRET_KEY=CHANGE_ME_LONG_SECRET_KEY
BACKEND_CORS_ORIGINS=http://SERVER_IP:8081
GIGACHAT_AUTH_KEY=CHANGE_ME_GIGACHAT_KEY
FIRST_ADMIN_PASSWORD=CHANGE_ME_ADMIN_PASSWORD
```

Сгенерировать `SECRET_KEY` можно командой:

```bash
openssl rand -hex 32
```

Пример для `BACKEND_CORS_ORIGINS`:

```env
BACKEND_CORS_ORIGINS=http://123.123.123.123:8081
```

Для первого запуска по HTTP:

```env
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
```

После перевода проекта на HTTPS нужно будет поменять:

```env
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
BACKEND_CORS_ORIGINS=https://ai.domain.ru
```

---

## 4. Проверка `docker-compose.prod.yml`

Для сервера, где порт `80` уже занят Nextcloud, в `docker-compose.prod.yml` должен быть такой блок:

```yml
services:
  backend:
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2

  celery_worker:
    command: celery -A app.worker.celery_app:celery_app worker --loglevel=info --concurrency=2

  frontend:
    build:
      context: ./frontend
      target: runner
      args:
        NEXT_PUBLIC_API_BASE_URL: /api/v1
    environment:
      NEXT_PUBLIC_API_BASE_URL: /api/v1

  nginx:
    ports:
      - "8081:80"
```

Это значит:

```text
SERVER_IP:8081 -> nginx проекта -> frontend/backend
```

---

## 5. Открытие порта 8081

Если на сервере включён `ufw`, открыть порт:

```bash
sudo ufw allow 8081/tcp
sudo ufw status
```

Если `ufw` выключен, этот шаг можно пропустить.

---

## 6. Запуск проекта

Запускать production compose нужно без `docker-compose.override.yml`:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Проверить контейнеры:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

Ожидаемые сервисы:

```text
postgres
rabbitmq
backend
celery_worker
frontend
nginx
```

---

## 7. Применение миграций

После запуска контейнеров применить миграции:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic upgrade head
```


## 8. Создание первого администратора

Проверить, что в `.env` заполнены переменные:

```env
FIRST_ADMIN_FULL_NAME=Администратор
FIRST_ADMIN_USERNAME=admin
FIRST_ADMIN_EMAIL=admin@example.com
FIRST_ADMIN_PASSWORD=CHANGE_ME_ADMIN_PASSWORD
FIRST_ADMIN_ORG=Администрация
FIRST_ADMIN_POST=Администратор
```

Запустить скрипт создания администратора:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python -m app.scripts.create_admin
```

Если запуск через модуль не сработал, можно запустить файл напрямую:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python app/scripts/create_admin.py
```

Проверить пользователя в базе:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres psql -U prompt_ai_user -d prompt_ai_db -c "select id, username, email, role, status, is_active from users;"
```

Если в `.env` используются другие `POSTGRES_USER` и `POSTGRES_DB`, нужно подставить свои значения.

---

## 9. Проверка приложения

Проверить frontend через nginx:

```bash
curl http://127.0.0.1:8081
```

Проверить backend через nginx:

```bash
curl http://127.0.0.1:8081/api/v1/users/me
```

Ответ `401 Unauthorized` для `/api/v1/users/me` без авторизации — нормальный.  
Это значит, что backend работает и endpoint защищён авторизацией.

Открыть сайт в браузере:

```text
http://SERVER_IP:8081
```

Проверить страницы:

```text
http://SERVER_IP:8081/login
http://SERVER_IP:8081/register
http://SERVER_IP:8081/chats
http://SERVER_IP:8081/prompts
http://SERVER_IP:8081/admin/users
http://SERVER_IP:8081/docs
```

---

## 10. Логи

Все сервисы:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

Backend:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
```

Frontend:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f frontend
```

Nginx:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f nginx
```

Celery worker:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f celery_worker
```

Postgres:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f postgres
```

RabbitMQ:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f rabbitmq
```

---

## 11. Обновление проекта на сервере

Когда новые изменения запушены в `main`, на сервере выполнить:

```bash
cd /opt/prompt-ai-app
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic upgrade head
```

Проверить:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
curl http://127.0.0.1:8081
curl http://127.0.0.1:8081/api/v1/users/me
```

---

## 12. Перезапуск проекта

```bash
cd /opt/prompt-ai-app
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart
```

Перезапуск только backend:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend
```

Перезапуск только frontend:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart frontend
```

---

## 13. Остановка проекта

Остановить проект без удаления данных:

```bash
cd /opt/prompt-ai-app
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

Остановить проект с удалением volumes:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v
```

> Внимание: `down -v` удалит данные Postgres. Использовать только если точно нужно полностью очистить проект.

---

## 14. Быстрая диагностика

Проверить, какие порты заняты:

```bash
sudo ss -tulpn | grep -E ':80|:443|:8081'
```

Проверить контейнеры на сервере:

```bash
docker ps
```

Проверить контейнеры только этого проекта:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

Проверить переменные окружения backend-контейнера:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend env | sort
```

Проверить импорт SQLAlchemy Base:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python -c "from app.db.base import Base; print(Base)"
```

---

## 15. Будущая production-схема с доменом и HTTPS

Сейчас проект доступен так:

```text
http://SERVER_IP:8081
```

Финальная схема должна быть такой:

```text
cloud.domain.ru -> Nextcloud
ai.domain.ru    -> Prompt AI App
```

Для этого нужен общий reverse proxy, который будет слушать `80/443` и распределять запросы по доменам:

```text
80/443 -> общий nginx/caddy/traefik
          ├── cloud.domain.ru -> Nextcloud
          └── ai.domain.ru    -> Prompt AI App
```

После перевода на HTTPS в `.env` нужно будет изменить:

```env
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
BACKEND_CORS_ORIGINS=https://ai.domain.ru
```

А `docker-compose.prod.yml` лучше будет перевести на локальный bind:

```yml
services:
  nginx:
    ports:
      - "127.0.0.1:8081:80"
```

Тогда проект не будет торчать наружу напрямую по порту `8081`, а будет доступен только через домен и reverse proxy.
