import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException
from openai import APIError, AsyncOpenAI
from PIL import Image

from app.config import get_settings
from app.db.models import AssetRecord, PromotionRecord
from app.promotion.content_generator import build_content
from app.promotion.poster_renderer import render_poster
from app.promotion.quota_service import reserve_quota
from app.promotion.schemas import PromotionRequest, PromotionResponse
from app.promotion.strategy_adapter import load_strategy


async def create_promotion(session, request: PromotionRequest) -> PromotionResponse:
    if not request.demo_mode and not request.strategy_id:
        raise HTTPException(status_code=422, detail="strategy_id is required outside demo mode")
    key = request.idempotency_key or str(uuid4())
    existing = session.query(PromotionRecord).filter_by(idempotency_key=key).first()
    if existing:
        return _response(session, existing)
    if request.strategy_id:
        strategy = load_strategy(session, request.strategy_id, request.merchant_id)
    elif request.demo_mode:
        raise HTTPException(status_code=422, detail="demo strategy fixture must be supplied by the demo endpoint")
    else:
        raise HTTPException(status_code=422, detail="strategy_id is required")
    if not request.product_snapshot:
        raise HTTPException(status_code=422, detail="product_snapshot is required when no product repository is configured")
    remaining, period = reserve_quota(session, request.merchant_id, key)
    content = build_content(strategy, request.product_snapshot, request.language, request.channels, request.approved_offer, request.cta_preferences)
    settings = get_settings()
    if settings.openai_api_key:
        try:
            from app.promotion.content_generator import generate_content
            content = await generate_content(
                AsyncOpenAI(api_key=settings.openai_api_key),
                settings.openai_text_model_effective,
                strategy,
                request.product_snapshot,
                request.language,
                request.channels,
                request.approved_offer,
                request.cta_preferences,
            )
        except (APIError, ValueError):
            content.assumptions.append("OpenAI promotion refinement was unavailable; deterministic copy was returned.")
    promotion_id = str(uuid4())
    record = PromotionRecord(
        promotion_id=promotion_id,
        strategy_id=request.strategy_id or strategy.strategy_id,
        merchant_id=request.merchant_id,
        request_json=request.model_dump_json(),
        content_json=content.model_dump_json(),
        demo=request.demo_mode,
        idempotency_key=key,
    )
    session.add(record)
    session.flush()
    for format in request.formats:
        storage_dir = Path(get_settings().effective_asset_storage_dir)
        asset_id, width, height = render_poster(content, storage_dir, format)
        session.add(AssetRecord(asset_id=asset_id, merchant_id=request.merchant_id, promotion_id=promotion_id, filename=f"{asset_id}.png", path=str(storage_dir / f"{asset_id}.png"), mime_type="image/png", asset_type=f"poster_{format.value}", width=width, height=height))
    session.commit()
    return _response(session, record, remaining, period)


def _response(session, record: PromotionRecord, remaining: int | None = None, period: str | None = None) -> PromotionResponse:
    assets = session.query(AssetRecord).filter_by(promotion_id=record.promotion_id).all()
    if remaining is None:
        remaining = 0
    return PromotionResponse(
        promotion_id=record.promotion_id,
        strategy_id=record.strategy_id,
        merchant_id=record.merchant_id,
        demo=record.demo,
        content=json.loads(record.content_json),
        poster_asset_ids=[asset.asset_id for asset in assets],
        asset_urls=[f"/api/v1/promotions/assets/{asset.asset_id}" for asset in assets],
        created_at=record.created_at,
        quota_remaining=remaining,
        quota_reset_date=period or datetime.now(timezone.utc).strftime("%Y-%m"),
    )


def save_uploaded_asset(session, merchant_id: str, asset_type: str, filename: str, content: bytes) -> AssetRecord:
    settings = get_settings()
    if len(content) > settings.effective_max_upload_bytes:
        raise HTTPException(status_code=413, detail="asset exceeds configured size limit")
    if asset_type not in {"logo", "product_image", "campaign_artwork"}:
        raise HTTPException(status_code=422, detail="unsupported asset type")
    asset_id = str(uuid4())
    path = Path(settings.effective_asset_storage_dir) / f"{asset_id}.png"
    try:
        from io import BytesIO
        with Image.open(BytesIO(content)) as image:
            image = image.convert("RGBA")
            path.parent.mkdir(parents=True, exist_ok=True)
            image.save(path, "PNG")
            width, height = image.size
    except Exception as exc:
        raise HTTPException(status_code=422, detail="uploaded file is not a valid image") from exc
    asset = AssetRecord(asset_id=asset_id, merchant_id=merchant_id, filename=filename[:255], path=str(path), mime_type="image/png", asset_type=asset_type, width=width, height=height)
    session.add(asset)
    session.commit()
    return asset
