import secrets
from datetime import datetime, timedelta, timezone

from app.config import get_settings
from app.db.models import TelegramBinding, TelegramLinkToken, TelegramUpdate


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
