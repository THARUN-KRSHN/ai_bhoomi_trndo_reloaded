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
app = FastAPI(title=get_settings().app_name, version="1.0.0")
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
