import json
from fastapi import APIRouter, Request

from app.auth.service import current_user
from app.db.database import SessionLocal
from app.db.models import ShopProfile, TrendSearchRecord
from app.trends.adapter import search
from app.trends.schemas import TrendSearchRequest, TrendSearchResponse

router = APIRouter(prefix="/api/v1/trends")


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
