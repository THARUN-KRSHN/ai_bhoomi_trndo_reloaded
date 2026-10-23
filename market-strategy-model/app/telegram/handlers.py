from app.db.database import SessionLocal
from app.db.models import OrderRecord, PromotionRecord, TelegramBinding
from app.orders.schemas import OrderCreate, OrderStatus
from app.orders.service import create_order, transition_order
from app.telegram.client import TelegramClient
from app.telegram.service import consume_link_token, record_update_once


async def handle_update(update: dict, client: TelegramClient) -> dict:
    update_id = str(update.get("update_id", ""))
    with SessionLocal() as session:
        if not update_id or not record_update_once(session, update_id):
            return {"status": "duplicate_ignored"}
        if update.get("callback_query"):
            return await _handle_callback(session, update["callback_query"], client)
        message = update.get("message", {})
        chat_id = str(message.get("chat", {}).get("id", ""))
        text = str(message.get("text", ""))
        if text.startswith("/start ") and chat_id:
            linked = consume_link_token(session, text.split(" ", 1)[1], chat_id)
            await client.send_message(chat_id, "Merchant Telegram account linked." if linked else "This link is invalid or expired.")
            return {"status": "linked" if linked else "invalid_link"}
        if text.startswith("/order "):
            parts = text.split("|")
            if len(parts) < 3:
                await client.send_message(chat_id, "Use /order product | quantity | optional notes")
                return {"status": "invalid_order"}
            try:
                quantity = int(parts[1].strip())
            except ValueError:
                await client.send_message(chat_id, "Quantity must be a positive whole number.")
                return {"status": "invalid_order"}
            merchant_id = parts[3].strip() if len(parts) > 3 else "development-merchant"
            order = create_order(session, OrderCreate(merchant_id=merchant_id, product_name=parts[0].replace("/order", "").strip(), quantity=quantity, telegram_chat_id=chat_id, fulfillment_notes=parts[2].strip(), unit_price=None))
            binding = session.query(TelegramBinding).filter_by(merchant_id=merchant_id).first()
            await client.send_message(chat_id, f"Order request {order.order_id} received; it is awaiting shop confirmation.")
            if binding:
                await client.send_message(binding.chat_id, f"New enquiry {order.order_id}: {order.product_name}, quantity {order.quantity}.")
            return {"status": "order_created", "order_id": order.order_id}
        return {"status": "accepted"}


async def _handle_callback(session, callback: dict, client: TelegramClient) -> dict:
    data = str(callback.get("data", ""))
    chat_id = str(callback.get("message", {}).get("chat", {}).get("id", ""))
    action, _, order_id = data.partition(":")
    binding = session.query(TelegramBinding).filter_by(chat_id=chat_id).first()
    if not binding or action not in {"confirm", "reject"}:
        await client.send_message(chat_id, "This action is not authorized.")
        return {"status": "unauthorized"}
    target = OrderStatus.confirmed if action == "confirm" else OrderStatus.rejected
    transition_order(session, order_id, target, binding.merchant_id)
    await client.send_message(chat_id, f"Order {order_id} {target.value}.")
    return {"status": target.value}
