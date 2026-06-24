from fastapi import FastAPI

from app.api.v1.health import router as health_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
)

app.include_router(
    health_router,
    prefix=settings.API_V1_PREFIX,
)


@app.get("/")
def root():
    return {
        "message": "Prompt AI App backend is running",
    }