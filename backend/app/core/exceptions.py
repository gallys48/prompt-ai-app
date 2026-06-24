class AppError(Exception):
    """Базовая ошибка приложения."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class NotFoundError(AppError):
    """Сущность не найдена."""


class ConflictError(AppError):
    """Конфликт данных, например email уже занят."""


class ForbiddenError(AppError):
    """Недостаточно прав."""


class BadRequestError(AppError):
    """Некорректный запрос."""