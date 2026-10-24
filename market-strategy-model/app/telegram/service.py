import json
import secrets
from datetime import datetime, timedelta, timezone

from app.config import get_settings
from app.db.models import (
    OrderRecord,
    PromotionRecord,
    ShopProfile,
    TelegramBinding,
    TelegramConversationState,
    TelegramLinkToken,
    TelegramUpdate,
)


def create_link_token(session, merchant_id: str) -> str:
    token = secrets.token_urlsafe(24)
    session.add(TelegramLinkToken(token=token, merchant_id=merchant_id, expires_at=datetime.now(timezone.utc) + timedelta(minutes=10)))
    session.commit()
    return token


def consume_link_token(session, token: str, chat_id: str) -> bool:
    record = session.query(TelegramLinkToken).filter_by(token=token).first()
    now = datetime.now(timezone.utc)
    expires_at = record.expires_at.replace(tzinfo=timezone.utc) if record and record.expires_at.tzinfo is None else (record.expires_at if record else None)
    if not record or record.consumed_at or expires_at < now:
        return False
    record.consumed_at = now
    existing = session.query(TelegramBinding).filter_by(merchant_id=record.merchant_id).first()
    if existing:
        existing.chat_id = chat_id
    else:
        session.add(TelegramBinding(merchant_id=record.merchant_id, chat_id=chat_id))
    session.commit()
    return True


def record_update_once(session, update_id: str) -> bool:
    if session.query(TelegramUpdate).filter_by(update_id=update_id).first():
        return False
    session.add(TelegramUpdate(update_id=update_id))
    session.commit()
    return True


def deep_link(token: str) -> str:
    username = get_settings().telegram_bot_username
    return f"https://t.me/{username}?start={token}" if username else f"telegram-link://{token}"


def get_conversation_state(session, chat_id: str) -> tuple[str, dict]:
    record = session.query(TelegramConversationState).filter_by(chat_id=str(chat_id)).first()
    if not record:
        return "idle", {}
    try:
        ctx = json.loads(record.context_json) if record.context_json else {}
    except Exception:
        ctx = {}
    return record.state, ctx


def set_conversation_state(session, chat_id: str, state: str, context: dict | None = None) -> None:
    record = session.query(TelegramConversationState).filter_by(chat_id=str(chat_id)).first()
    ctx_json = json.dumps(context or {})
    if record:
        record.state = state
        record.context_json = ctx_json
        record.updated_at = datetime.now(timezone.utc)
    else:
        record = TelegramConversationState(chat_id=str(chat_id), state=state, context_json=ctx_json)
        session.add(record)
    session.commit()


def clear_conversation_state(session, chat_id: str) -> None:
    record = session.query(TelegramConversationState).filter_by(chat_id=str(chat_id)).first()
    if record:
        record.state = "idle"
        record.context_json = "{}"
        record.updated_at = datetime.now(timezone.utc)
        session.commit()


def get_active_merchant(session, campaign_id: str | None = None) -> tuple[str, dict]:
    """Retrieves active merchant_id and profile. If campaign_id provided, resolves that promotion's merchant."""
    if campaign_id:
        clean_id = campaign_id.replace("promo_", "").replace("campaign_", "").strip()
        promo = (
            session.query(PromotionRecord)
            .filter((PromotionRecord.promotion_id == campaign_id) | (PromotionRecord.promotion_id == clean_id))
            .first()
        )
        if promo:
            profile_rec = session.query(ShopProfile).filter_by(user_id=promo.merchant_id).first()
            if not profile_rec and promo.user_id:
                profile_rec = session.query(ShopProfile).filter_by(user_id=promo.user_id).first()
            prof = json.loads(profile_rec.profile_json) if profile_rec and profile_rec.profile_json else {}
            return promo.merchant_id, prof

    # Fallback to bound merchant or first profile
    binding = session.query(TelegramBinding).first()
    if binding:
        profile_rec = (
            session.query(ShopProfile)
            .filter((ShopProfile.user_id == binding.merchant_id) | (ShopProfile.user_id == binding.user_id))
            .first()
        )
        prof = json.loads(profile_rec.profile_json) if profile_rec and profile_rec.profile_json else {}
        return binding.merchant_id, prof

    profile_rec = session.query(ShopProfile).first()
    if profile_rec:
        prof = json.loads(profile_rec.profile_json) if profile_rec.profile_json else {}
        return profile_rec.user_id, prof

    return "development-merchant", {}


def get_shop_catalog(session, merchant_id: str | None = None) -> list[dict]:
    """Retrieves verified products from the shop profile. Does not invent products or prices."""
    m_id, profile = get_active_merchant(session, campaign_id=None)
    if merchant_id:
        profile_rec = session.query(ShopProfile).filter_by(user_id=merchant_id).first()
        if profile_rec and profile_rec.profile_json:
            profile = json.loads(profile_rec.profile_json)

    raw_products = profile.get("products_services") or profile.get("products") or []
    catalog = []
    for item in raw_products:
        if isinstance(item, str):
            catalog.append({"name": item, "description": "", "price": None, "currency": "INR"})
        elif isinstance(item, dict):
            name = item.get("name")
            if name:
                price = None
                if item.get("price") is not None:
                    try:
                        price = float(item["price"])
                    except (ValueError, TypeError):
                        price = None
                catalog.append({
                    "name": str(name),
                    "description": str(item.get("description") or ""),
                    "price": price,
                    "currency": str(item.get("currency") or "INR"),
                })
    return catalog


def find_product(session, product_name: str, merchant_id: str | None = None) -> dict | None:
    catalog = get_shop_catalog(session, merchant_id)
    target = product_name.strip().lower()
    for prod in catalog:
        if prod["name"].strip().lower() == target:
            return prod
    for prod in catalog:
        if target in prod["name"].strip().lower() or prod["name"].strip().lower() in target:
            return prod
    return None


def get_customer_orders(session, chat_id: str) -> list[OrderRecord]:
    """Returns only orders belonging to the specified Telegram customer identity."""
    return (
        session.query(OrderRecord)
        .filter_by(telegram_chat_id=str(chat_id))
        .order_by(OrderRecord.created_at.desc())
        .all()
    )


def get_merchant_binding(session, merchant_id: str) -> TelegramBinding | None:
    return session.query(TelegramBinding).filter_by(merchant_id=merchant_id).first()


def get_binding_by_chat_id(session, chat_id: str) -> TelegramBinding | None:
    return session.query(TelegramBinding).filter_by(chat_id=str(chat_id)).first()
