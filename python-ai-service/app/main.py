from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI

from app.api.routes import router
from app.core.config import get_settings
from app.services.model_registry import ModelRegistry

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    registry = ModelRegistry(settings)
    registry.load()
    app.state.registry = registry
    yield
    registry.shutdown()


settings = get_settings()
app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)
app.include_router(router, prefix="/v1")

