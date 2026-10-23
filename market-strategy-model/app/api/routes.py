import json
from fastapi import APIRouter, HTTPException

from app.config import get_settings
from app.db.database import SessionLocal
from app.db.models import StrategyRecord
from app.schemas.requests import BusinessRequest
from app.schemas.reports import StrategyReport
from app.services.research.tavily_provider import TavilyProvider
from app.services.research.youtube_provider import YouTubeProvider
from app.services.strategy.pipeline import generate_strategy

router = APIRouter(prefix="/api/v1")


@router.get("/providers/status")
def provider_status():
    settings = get_settings()
    return {"tavily": "configured" if settings.tavily_api_key else "not_configured", "youtube": "configured" if settings.youtube_api_key else "not_configured", "openai": "configured" if settings.openai_api_key else "not_configured"}


@router.post("/strategy/generate", response_model=StrategyReport)
async def generate(request: BusinessRequest):
    settings = get_settings()
    report = await generate_strategy(
        request,
        TavilyProvider(settings.tavily_api_key, settings.request_timeout_seconds, settings.max_web_results),
        YouTubeProvider(settings.youtube_api_key, settings.request_timeout_seconds, settings.max_youtube_results),
    )
    with SessionLocal() as session:
        session.add(StrategyRecord(strategy_id=report.strategy_id, request_json=request.model_dump_json(), report_json=report.model_dump_json(), score_version=report.score_version))
        session.commit()
    return report


@router.post("/strategy/demo", response_model=StrategyReport)
def demo():
    request = BusinessRequest(category="bakery", city="Kochi", region="Kerala", country="India", primary_language="English", products_services=[{"name": "Sourdough loaf", "description": "Fresh baked loaf", "price": 250}], target_audience="Nearby families seeking fresh bread", objective="awareness", campaign_time_horizon="14 days")
    report = StrategyReport.model_validate(generate_demo(request))
    return report


def generate_demo(request: BusinessRequest) -> dict:
    report = __import__("asyncio").run(generate_strategy(request, TavilyProvider(None), YouTubeProvider(None))).model_dump(mode="json")
    report["demo"] = True
    report["executive_recommendation"] = "DEMO/MOCK: Run a small local test; this report contains no live research."
    return report


@router.get("/strategy/{strategy_id}", response_model=StrategyReport)
def get_strategy(strategy_id: str):
    with SessionLocal() as session:
        record = session.query(StrategyRecord).filter_by(strategy_id=strategy_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return json.loads(record.report_json)
