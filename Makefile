COMPOSE=docker compose
TEST_COMPOSE=docker compose --profile test

.PHONY: help up up-build down restart ps logs logs-backend logs-worker logs-db logs-rabbitmq \
        shell shell-worker psql migrate makemigration admin test test-auth test-prompts test-chats \
        test-file test-one build-tests clean-logs clean-test-db

help:
	@echo "Available commands:"
	@echo "  make up              - Start dev containers"
	@echo "  make up-build        - Build and start dev containers"
	@echo "  make down            - Stop dev containers"
	@echo "  make restart         - Restart dev containers"
	@echo "  make ps              - Show containers"
	@echo "  make logs            - Show all logs"
	@echo "  make logs-backend    - Show backend logs"
	@echo "  make logs-worker     - Show celery worker logs"
	@echo "  make shell           - Open backend shell"
	@echo "  make psql            - Open PostgreSQL shell"
	@echo "  make migrate         - Run Alembic migrations"
	@echo "  make makemigration m='message' - Create Alembic migration"
	@echo "  make admin           - Create first admin"
	@echo "  make test            - Run all backend tests"
	@echo "  make test-auth       - Run auth tests"
	@echo "  make test-prompts    - Run prompt tests"
	@echo "  make test-chats      - Run chat tests"
	@echo "  make clean-logs      - Remove backend log files"
	@echo "  make clean-test-db   - Remove test DB volume"

up:
	$(COMPOSE) up

up-build:
	$(COMPOSE) up --build

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart

ps:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f

logs-backend:
	$(COMPOSE) logs -f backend

logs-worker:
	$(COMPOSE) logs -f celery_worker

logs-db:
	$(COMPOSE) logs -f postgres

logs-rabbitmq:
	$(COMPOSE) logs -f rabbitmq

shell:
	$(COMPOSE) exec backend sh

shell-worker:
	$(COMPOSE) exec celery_worker sh

psql:
	$(COMPOSE) exec postgres psql -U prompt_ai_user -d prompt_ai_db

migrate:
	$(COMPOSE) exec backend alembic upgrade head

makemigration:
	$(COMPOSE) exec backend alembic revision --autogenerate -m "$(m)"

admin:
	$(COMPOSE) exec backend python -m app.scripts.create_admin

build-tests:
	$(TEST_COMPOSE) build backend_tests

test:
	$(TEST_COMPOSE) run --rm backend_tests

test-auth:
	$(TEST_COMPOSE) run --rm backend_tests pytest tests/test_auth.py -q

test-prompts:
	$(TEST_COMPOSE) run --rm backend_tests pytest tests/test_prompts.py -q

test-chats:
	$(TEST_COMPOSE) run --rm backend_tests pytest tests/test_chats.py -q

test-file:
	$(TEST_COMPOSE) run --rm backend_tests pytest $(file) -q

test-one:
	$(TEST_COMPOSE) run --rm backend_tests pytest $(test) -q

clean-logs:
	rm -rf backend/logs/*

clean-test-db:
	$(COMPOSE) down
	docker volume rm prompt-ai-app_postgres_test_data || true