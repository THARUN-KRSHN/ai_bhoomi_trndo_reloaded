import uuid
from datetime import datetime, timezone

import httpx

from app.config import get_settings
from app.db.models import ShopProfile, TrendSearchRecord


async def search(session, user_id: str, payload: dict, profile: dict) -> tuple[TrendSearchRecord, dict]:
    settings = get_settings()
    request_payload = {"business": payload["topic"], "topic": payload["topic"], "profile": profile, "filters": payload.get("filters", {})}
    search_id = f"search-{uuid.uuid4().hex}"
    result = {}
    demo = False
    error = None
    try:
        async with httpx.AsyncClient(timeout=settings.trend_finder_timeout_seconds) as client:
            response = await client.post(f"{settings.trend_finder_base_url.rstrip('/')}/get_trends", json=request_payload)
            response.raise_for_status()
            result = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        error = f"trend finder unavailable: {exc}"
        if not settings.promotion_demo_mode:
            raise
    if error:
        result = {"status": "unavailable", "topic": payload["topic"], "error": error, "limitations": ["No live Trend Finder result was available."]}
    record = TrendSearchRecord(search_id=search_id, user_id=user_id, topic=payload["topic"], request_json=__import__("json").dumps(request_payload), result_json=__import__("json").dumps(result), demo=demo, error=error)
    session.add(record)
    session.commit()
    return record, result
