from fastapi import APIRouter, Header, HTTPException, Request

from app.config import get_settings
from app.db.database import SessionLocal
from app.telegram.client import TelegramClient
from app.telegram.handlers import handle_update
from app.telegram.service import create_link_token, deep_link
from app.auth.service import current_user
from app.db.models import TelegramBinding

router = APIRouter(prefix="/api/v1/telegram")


@router.post("/link-token")
def link_token(merchant_id: str, request: Request):
    with SessionLocal() as session:
        user = current_user(request, session) if request.headers.get("Authorization") else None
        if user:
            merchant_id = user.user_id
        token = create_link_token(session, merchant_id)
    return {"token": token, "expires_in_seconds": 600, "deep_link": deep_link(token)}


@router.post("/webhook")
async def webhook(payload: dict, x_telegram_bot_api_secret_token: str | None = Header(default=None)):
    settings = get_settings()
    if settings.telegram_webhook_secret and x_telegram_bot_api_secret_token != settings.telegram_webhook_secret:
        raise HTTPException(status_code=403, detail="invalid Telegram webhook secret")
    if not payload.get("update_id"):
        raise HTTPException(status_code=400, detail="Telegram update_id is required")
    return await handle_update(payload, TelegramClient())


@router.get("/conversations")
def conversations(request: Request):
    with SessionLocal() as session:
        user = current_user(request, session)
        from app.db.models import OrderRecord
        binding = session.query(TelegramBinding).filter((TelegramBinding.user_id == user.user_id) | (TelegramBinding.merchant_id == user.user_id)).first()
        orders = session.query(OrderRecord).filter((OrderRecord.user_id == user.user_id) | (OrderRecord.merchant_id == user.user_id)).filter(OrderRecord.telegram_chat_id.isnot(None)).order_by(OrderRecord.created_at.desc()).all()

        items = []
        for ord in orders:
            items.append({
                "conversation_id": f"conv-{ord.order_id}",
                "order_id": ord.order_id,
                "chat_id": ord.telegram_chat_id,
                "customer_name": f"Telegram Customer #{ord.order_id[-4:]}",
                "product_name": ord.product_name,
                "last_message": f"Enquiry for {ord.quantity}x {ord.product_name}. Status: {ord.status}",
                "updated_at": ord.updated_at.isoformat() if ord.updated_at else ord.created_at.isoformat(),
                "status": ord.status,
            })

        return {
            "linked": bool(binding),
            "chat_id": binding.chat_id if binding else None,
            "conversations": items,
        }


@router.post("/conversations/{conversation_id}/reply")
async def reply_conversation(conversation_id: str, payload: dict, request: Request):
    with SessionLocal() as session:
        user = current_user(request, session)
        chat_id = payload.get("chat_id")
        text = payload.get("message")
        if not chat_id or not text:
            raise HTTPException(status_code=400, detail="chat_id and message are required")
        client = TelegramClient()
        if not client.configured:
            return {"status": "sent", "chat_id": chat_id, "simulated": True, "note": "Telegram bot token not configured in environment"}
        await client.send_message(chat_id, text)
        return {"status": "sent", "chat_id": chat_id}

