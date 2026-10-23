import json
from fastapi import APIRouter, Request

from app.auth.service import current_user
from app.db.database import SessionLocal
from app.db.models import ShopProfile, TrendSearchRecord
from app.trends.adapter import search
from app.trends.schemas import TrendSearchRequest, TrendSearchResponse

router = APIRouter(prefix="/api/v1/trends")


@router.get("/recent")
def recent_trends(request: Request, limit: int = 5):
    with SessionLocal() as session:
        user = current_user(request, session)
        records = session.query(TrendSearchRecord).filter_by(user_id=user.user_id).order_by(TrendSearchRecord.created_at.desc()).limit(min(max(limit, 1), 20)).all()
        return [{"search_id": record.search_id, "topic": record.topic, "demo": record.demo, "created_at": record.created_at, "result": json.loads(record.result_json), "error": record.error} for record in records]


@router.get("/category-options")
async def category_options(category: str, request: Request):
    with SessionLocal() as session:
        current_user(request, session)
    import httpx
    settings = __import__("app.config", fromlist=["get_settings"]).get_settings()
    try:
        async with httpx.AsyncClient(timeout=settings.trend_finder_timeout_seconds) as client:
            response = await client.get(f"{settings.trend_finder_base_url.rstrip('/')}/category-options", params={"category": category})
            response.raise_for_status()
            return response.json()
    except (httpx.HTTPError, ValueError):
        return {
            "category": category,
            "products": [f"{category} essentials", f"{category} bestsellers", f"new {category} arrivals"],
            "audiences": ["Local families", "Young professionals", "Value-conscious shoppers"],
            "brand_personalities": ["Trusted", "Modern", "Friendly", "Premium"],
            "channels": ["Instagram", "Telegram", "WhatsApp", "Local search"],
        }


@router.post("/search", response_model=TrendSearchResponse)
async def trend_search(payload: TrendSearchRequest, request: Request):
    with SessionLocal() as session:
        user = current_user(request, session)
        profile_record = session.query(ShopProfile).filter_by(user_id=user.user_id).first()
        profile = json.loads(profile_record.profile_json) if profile_record else {}
        record, result = await search(session, user.user_id, payload.model_dump(), profile)
        return TrendSearchResponse(search_id=record.search_id, topic=record.topic, demo=record.demo, result=result)


@router.get("/search/{search_id}")
def get_trend_search(search_id: str, request: Request):
    with SessionLocal() as session:
        user = current_user(request, session)
        record = session.query(TrendSearchRecord).filter_by(search_id=search_id, user_id=user.user_id).first()
        if not record:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="trend search not found")
        return {"search_id": record.search_id, "topic": record.topic, "demo": record.demo, "result": json.loads(record.result_json), "error": record.error}
