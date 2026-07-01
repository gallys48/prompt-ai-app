from starlette import status


class AppException(Exception):
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail: str = "Internal server error"

    def __init__(self, detail: str | None = None):
        if detail is not None:
            self.detail = detail

        self.message = self.detail
        super().__init__(self.detail)


class BadRequestError(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Bad request"


class UnauthorizedError(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Not authenticated"


class ForbiddenError(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    detail = "Forbidden"


class NotFoundError(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Not found"


class ConflictError(AppException):
    status_code = status.HTTP_409_CONFLICT
    detail = "Conflict"