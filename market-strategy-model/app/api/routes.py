import json
from fastapi import APIRouter, HTTPException, Request

from app.config import get_settings
from app.db.database import SessionLocal
from app.db.models import ShopProfile, StrategyRecord, TrendSearchRecord
from app.auth.service import current_user
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
async def generate(request: BusinessRequest, http_request: Request):
    settings = get_settings()
    report = await generate_strategy(
        request,
        TavilyProvider(settings.tavily_api_key, settings.request_timeout_seconds, settings.max_web_results),
        YouTubeProvider(settings.youtube_api_key, settings.request_timeout_seconds, settings.max_youtube_results),
    )
    with SessionLocal() as session:
        user = None
        if http_request.headers.get("Authorization"):
            user = current_user(http_request, session)
        session.add(StrategyRecord(strategy_id=report.strategy_id, user_id=user.user_id if user else None, request_json=request.model_dump_json(), report_json=report.model_dump_json(), score_version=report.score_version))
        session.commit()
    return report


@router.post("/strategy/demo", response_model=StrategyReport)
def demo():
    request = BusinessRequest(category="bakery", city="Kochi", region="Kerala", country="India", primary_language="English", products_services=[{"name": "Sourdough loaf", "description": "Fresh baked loaf", "price": 250}], target_audience="Nearby families seeking fresh bread", objective="awareness", campaign_time_horizon="14 days")
    report = StrategyReport.model_validate(generate_demo(request))
    return report


@router.post("/strategy/from-trend/{search_id}", response_model=StrategyReport)
async def generate_from_trend(search_id: str, request: Request, product_name: str | None = None):
    with SessionLocal() as session:
        user = current_user(request, session)
        trend = session.query(TrendSearchRecord).filter_by(search_id=search_id, user_id=user.user_id).first()
        profile_record = session.query(ShopProfile).filter_by(user_id=user.user_id).first()
        if not trend or not profile_record:
            raise HTTPException(status_code=404, detail="trend search or shop profile not found")
        profile = json.loads(profile_record.profile_json)

        if product_name:
            products = [{"name": product_name.strip(), "description": f"Trending {product_name.strip()} opportunity for {profile.get('shop_name', 'our shop')}", "price": None}]
        else:
            products = profile.get("products_services") or profile.get("products") or [{"name": trend.topic, "description": profile.get("short_description") or profile.get("description", ""), "price": None}]

        request_model = BusinessRequest(
            business_name=profile.get("shop_name", "Shop"),
            category=profile.get("business_category") or profile.get("category", "Retail"),
            subcategory=profile.get("business_subcategory") or profile.get("subcategory"),
            city=profile.get("city", "Kerala"),
            region=profile.get("region", "Kerala"),
            country=profile.get("country", "India"),
            primary_language=profile.get("primary_language", "English"),
            secondary_languages=profile.get("additional_languages") or profile.get("secondary_languages", []),
            products_services=products,
            target_audience=profile.get("target_audience") or profile.get("audience_description", "Local customers"),
            objective=profile.get("objective", "increase_qualified_inquiries"),
            preferred_channels=profile.get("preferred_channels", ["Instagram", "WhatsApp"]),
            brand_personality=profile.get("brand_personality") if isinstance(profile.get("brand_personality"), str) else ", ".join(profile.get("brand_personality") or []) or None,
            campaign_time_horizon="14 days",
            constraints=profile.get("constraints", []),
        )
    report = await generate_strategy(request_model, TavilyProvider(get_settings().tavily_api_key, get_settings().request_timeout_seconds, get_settings().max_web_results), YouTubeProvider(get_settings().youtube_api_key, get_settings().request_timeout_seconds, get_settings().max_youtube_results))
    with SessionLocal() as session:
        session.add(StrategyRecord(strategy_id=report.strategy_id, user_id=user.user_id, request_json=request_model.model_dump_json(), report_json=report.model_dump_json(), score_version=report.score_version))
        session.commit()
    return report


def generate_demo(request: BusinessRequest) -> dict:
    report = __import__("asyncio").run(generate_strategy(request, TavilyProvider(None), YouTubeProvider(None))).model_dump(mode="json")
    report["demo"] = True
    report["executive_recommendation"] = "DEMO/MOCK: Run a small local test; this report contains no live research."
    return report


@router.get("/strategy/{strategy_id}", response_model=StrategyReport)
def get_strategy(strategy_id: str, request: Request):
    with SessionLocal() as session:
        query = session.query(StrategyRecord).filter_by(strategy_id=strategy_id)
        if request.headers.get("Authorization"):
            query = query.filter_by(user_id=current_user(request, session).user_id)
        record = query.first()
    if not record:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return json.loads(record.report_json)


@router.get("/strategies")
def list_strategies(request: Request, limit: int = 10):
    with SessionLocal() as session:
        query = session.query(StrategyRecord)
        if request.headers.get("Authorization"):
            user = current_user(request, session)
            query = query.filter_by(user_id=user.user_id)
        records = query.order_by(StrategyRecord.created_at.desc()).limit(min(max(limit, 1), 50)).all()
        results = []
        for r in records:
            report_data = json.loads(r.report_json)
            results.append({
                "strategy_id": r.strategy_id,
                "user_id": r.user_id,
                "created_at": r.created_at,
                "score_version": r.score_version,
                "report": report_data,
            })
        return results

