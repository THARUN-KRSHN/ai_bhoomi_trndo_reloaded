from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import get_settings
from app.db.database import Base, engine
from app.promotion.routes import router as promotion_router
from app.db import models  # noqa: F401
from app.telegram.routes import router as telegram_router
from app.auth.routes import router as auth_router, profile_router
from app.trends.routes import router as trends_router

Base.metadata.create_all(bind=engine)


def _add_missing_columns() -> None:
    """Keep the local SQLite prototype usable when new fields are added."""
    from sqlalchemy import inspect, text

    inspector = inspect(engine)
    tables = inspector.get_table_names()

    if "users" in tables:
        columns = {column["name"] for column in inspector.get_columns("users")}
        if "onboarding_skipped" not in columns:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE users ADD COLUMN onboarding_skipped BOOLEAN DEFAULT 0"))

    for table_name in ["orders", "promotions", "assets", "strategies", "telegram_bindings"]:
        if table_name in tables:
            columns = {column["name"] for column in inspector.get_columns(table_name)}
            if "user_id" not in columns:
                with engine.begin() as connection:
                    connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN user_id VARCHAR(64)"))


import asyncio
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    polling_task = None
    if settings.telegram_bot_token and settings.telegram_mode == "polling":
        from app.telegram.polling import run as run_telegram_polling
        polling_task = asyncio.create_task(run_telegram_polling())
    yield
    if polling_task:
        polling_task.cancel()
        try:
            await polling_task
        except asyncio.CancelledError:
            pass


_add_missing_columns()
app = FastAPI(title=get_settings().app_name, version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)
app.include_router(router)
app.include_router(promotion_router)
app.include_router(telegram_router)
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(trends_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": get_settings().app_name}
