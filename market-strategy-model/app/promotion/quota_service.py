from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError

from app.config import get_settings
from app.db.models import UsageRecord


def reserve_quota(session, merchant_id: str, idempotency_key: str, premium: bool = False) -> tuple[int, str]:
    period = datetime.now(timezone.utc).strftime("%Y-%m")
    existing = session.query(UsageRecord).filter_by(idempotency_key=idempotency_key).first()
    limit = get_settings().premium_monthly_promotion_quota if premium else get_settings().free_monthly_promotion_quota
    used = session.query(UsageRecord).filter_by(merchant_id=merchant_id, period=period).count()
    if existing:
        return max(0, limit - used), period
    if used >= limit:
        raise ValueError(f"monthly promotion quota exceeded; reset period is {period}")
    session.add(UsageRecord(merchant_id=merchant_id, period=period, idempotency_key=idempotency_key))
    try:
        session.flush()
    except IntegrityError as exc:
        session.rollback()
        raise ValueError("duplicate promotion generation request") from exc
    return limit - used - 1, period
