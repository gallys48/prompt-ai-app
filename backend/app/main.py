from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.prompts import router as prompts_router
from app.core.config import settings
from app.core.exceptions import (
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
)



app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
)


@app.exception_handler(BadRequestError)
async def bad_request_exception_handler(
    request: Request,
    exc: BadRequestError,
):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": exc.message},
    )


@app.exception_handler(ConflictError)
async def conflict_exception_handler(
    request: Request,
    exc: ConflictError,
):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": exc.message},
    )


@app.exception_handler(ForbiddenError)
async def forbidden_exception_handler(
    request: Request,
    exc: ForbiddenError,
):
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": exc.message},
    )


@app.exception_handler(NotFoundError)
async def not_found_exception_handler(
    request: Request,
    exc: NotFoundError,
):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": exc.message},
    )


app.include_router(
    health_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    auth_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    users_router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    prompts_router,
    prefix=settings.API_V1_PREFIX,
)

@app.get("/")
def root():
    return {
        "message": "Prompt AI App backend is running",
    }