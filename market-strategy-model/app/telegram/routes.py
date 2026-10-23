from fastapi import APIRouter, Header, HTTPException

from app.config import get_settings
from app.db.database import SessionLocal
from app.telegram.client import TelegramClient
from app.telegram.handlers import handle_update
from app.telegram.service import create_link_token, deep_link

router = APIRouter(prefix="/api/v1/telegram")


@router.post("/link-token")
def link_token(merchant_id: str):
    with SessionLocal() as session:
        token = create_link_token(session, merchant_id)
    return {"token": token, "expires_in_seconds": 600, "deep_link": deep_link(token)}


@router.post("/webhook")
def webhook(payload: dict, x_telegram_bot_api_secret_token: str | None = Header(default=None)):
    settings = get_settings()
    if settings.telegram_webhook_secret and x_telegram_bot_api_secret_token != settings.telegram_webhook_secret:
        raise HTTPException(status_code=403, detail="invalid Telegram webhook secret")
    if not payload.get("update_id"):
        raise HTTPException(status_code=400, detail="Telegram update_id is required")
    import asyncio
    return asyncio.run(handle_update(payload, TelegramClient()))
