import logging
import logging.config
from contextvars import ContextVar
from pathlib import Path

from app.core.config import settings


request_id_ctx_var: ContextVar[str] = ContextVar(
    "request_id",
    default="-",
)


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx_var.get()
        return True


def setup_logging() -> None:
    log_level = settings.LOG_LEVEL.upper()

    logs_dir = Path("/app/logs")
    logs_dir.mkdir(parents=True, exist_ok=True)

    app_log_path = logs_dir / "app.log"
    error_log_path = logs_dir / "error.log"

    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "filters": {
                "request_id": {
                    "()": RequestIdFilter,
                },
            },
            "formatters": {
                "default": {
                    "format": (
                        "%(asctime)s | %(levelname)s | %(name)s | "
                        "request_id=%(request_id)s | %(message)s"
                    ),
                },
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": "default",
                    "filters": ["request_id"],
                },
                "app_file": {
                    "class": "logging.handlers.RotatingFileHandler",
                    "filename": str(app_log_path),
                    "maxBytes": 10 * 1024 * 1024,
                    "backupCount": 5,
                    "encoding": "utf-8",
                    "formatter": "default",
                    "filters": ["request_id"],
                },
                "error_file": {
                    "class": "logging.handlers.RotatingFileHandler",
                    "filename": str(error_log_path),
                    "maxBytes": 10 * 1024 * 1024,
                    "backupCount": 5,
                    "encoding": "utf-8",
                    "level": "ERROR",
                    "formatter": "default",
                    "filters": ["request_id"],
                },
            },
            "root": {
                "level": log_level,
                "handlers": [
                    "console",
                    "app_file",
                    "error_file",
                ],
            },
            "loggers": {
                "uvicorn": {
                    "level": log_level,
                    "handlers": [
                        "console",
                        "app_file",
                        "error_file",
                    ],
                    "propagate": False,
                },
                "uvicorn.error": {
                    "level": log_level,
                    "handlers": [
                        "console",
                        "app_file",
                        "error_file",
                    ],
                    "propagate": False,
                },
                "uvicorn.access": {
                    "level": log_level,
                    "handlers": [
                        "console",
                        "app_file",
                    ],
                    "propagate": False,
                },
                "sqlalchemy.engine": {
                    "level": "WARNING",
                    "handlers": [
                        "console",
                        "app_file",
                        "error_file",
                    ],
                    "propagate": False,
                },
                "celery": {
                    "level": log_level,
                    "handlers": [
                        "console",
                        "app_file",
                        "error_file",
                    ],
                    "propagate": False,
                },
            },
        }
    )