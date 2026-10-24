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
    else:
        from app.schemas.reports import Decision, KPIPlan, Opportunity, StrategyReport
        strategy = StrategyReport(
            strategy_id=f"standalone-{uuid4()}",
            generated_at=datetime.now(timezone.utc),
            demo=request.demo_mode,
            business_context_summary=f"Promotion for {request.product_snapshot.name}",
            executive_recommendation=f"Promote {request.product_snapshot.name} with focused localized creative.",
            recommended_decision=Decision.pursue,
            business_objective="customer_acquisition",
            target_segment="Local retail shoppers",
            jobs_to_be_done=[f"Purchase quality {request.product_snapshot.name}"],
            customer_need=request.product_snapshot.description,
            barriers=["Local competition", "Short attention window"],
            market_summary="Active consumer search interest.",
            competitor_substitute_observations=["Standard mass-market retail options"],
            opportunities=[Opportunity(
                title=request.product_snapshot.name,
                demand_evidence_ids=[],
                momentum=78.0,
                momentum_reason="Emerging regional demand signals",
                durability="sustained",
                shop_fit=90.0,
                differentiation=80.0,
                commercial_feasibility=85.0,
                execution_feasibility=85.0,
                priority_score=85.0,
                evidence_confidence="high",
                limitations=[],
                decision=Decision.pursue,
            )],
            primary_positioning=f"Premium verified {request.product_snapshot.name}",
            value_proposition=request.product_snapshot.description,
            offer_recommendation="Featured Collection",
            pricing_safeguards=["Maintain approved pricing floor"],
            channel_strategy={"instagram": "Discovery reach", "whatsapp": "Direct orders"},
            campaign_steps=["Publish visual poster", "Take pre-orders on WhatsApp"],
            content_formats=["Poster", "Story", "Caption"],
            call_to_action="Order via WhatsApp",
            language=request.language,
            creative_direction="Minimalist luxury with bold typography",
            research_resources=[],
            source_register=[],
            kpi_plan=KPIPlan(
                metrics=["inquiries", "orders"],
                test_hypothesis="Localized commercial campaign drives direct orders.",
                comparison_method="baseline",
                guardrails=["maintain price floor"],
                decision_rules=["scale if conversion > 10%"],
            ),
            assumptions=[],
            missing_information=[],
            next_steps=["Share campaign poster on social channels"],
            score_version="v1",
        )
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
    # Resolve Logo Asset
    logo_path: Path | None = None
    target_logo_id = request.logo_asset_id or request.brand_asset_id
    if target_logo_id:
        logo_rec = session.query(AssetRecord).filter_by(asset_id=target_logo_id).first()
        if logo_rec and Path(logo_rec.path).is_file():
            logo_path = Path(logo_rec.path)

    # Resolve Product Visual (Asset, URL, or OpenAI Commercial Generation)
    storage_dir = Path(get_settings().effective_asset_storage_dir)
    storage_dir.mkdir(parents=True, exist_ok=True)
    product_visual_path: Path | None = None

    if request.product_image_asset_id:
        prod_rec = session.query(AssetRecord).filter_by(asset_id=request.product_image_asset_id).first()
        if prod_rec and Path(prod_rec.path).is_file():
            product_visual_path = Path(prod_rec.path)
    elif request.product_image_url and request.product_image_url.startswith("http"):
        try:
            import requests
            resp = requests.get(request.product_image_url, timeout=10)
            if resp.status_code == 200 and len(resp.content) > 1000:
                download_id = str(uuid4())
                download_path = storage_dir / f"downloaded_{download_id}.png"
                download_path.write_bytes(resp.content)
                product_visual_path = download_path
        except Exception:
            pass

    # If no image yet, generate high-end commercial visual via OpenAI image generation
    if not product_visual_path and settings.openai_api_key and settings.enable_ai_background_art:
        product_visual_path = await _generate_openai_commercial_artwork(
            settings.openai_api_key,
            settings.openai_image_model,
            request.product_snapshot.name,
            request.product_snapshot.description,
            content.campaign_angle,
            storage_dir,
        )

    for format in request.formats:
        asset_id, width, height = render_poster(
            content=content,
            target_dir=storage_dir,
            format=format,
            logo=logo_path,
            product_image=product_visual_path,
        )
        session.add(AssetRecord(
            asset_id=asset_id,
            merchant_id=request.merchant_id,
            promotion_id=promotion_id,
            filename=f"{asset_id}.png",
            path=str(storage_dir / f"{asset_id}.png"),
            mime_type="image/png",
            asset_type=f"poster_{format.value}",
            width=width,
            height=height,
        ))
    session.commit()
    return _response(session, record, remaining, period)


async def _generate_openai_commercial_artwork(
    api_key: str,
    configured_model: str,
    product_name: str,
    description: str,
    campaign_angle: str,
    storage_dir: Path,
) -> Path | None:
    client = AsyncOpenAI(api_key=api_key)
    prompt = (
        f"Commercial studio product photography of {product_name}, {description}. "
        f"Campaign theme: {campaign_angle}. Minimalist luxury advertising visual, "
        "professional studio lighting, elegant soft shadows, 8k resolution, crisp photorealistic, "
        "high fashion commercial magazine aesthetic, clean background negative space."
    )
    models_to_attempt = [configured_model, "gpt-image-1.5", "gpt-image-2", "chatgpt-image-latest"]
    for model in models_to_attempt:
        if not model:
            continue
        try:
            result = await client.images.generate(
                model=model,
                prompt=prompt,
                n=1,
                size="1024x1024",
            )
            data = result.data[0]
            gen_id = str(uuid4())
            gen_path = storage_dir / f"ai_gen_{gen_id}.png"
            if getattr(data, "b64_json", None):
                import base64
                gen_path.write_bytes(base64.b64decode(data.b64_json))
                return gen_path
            elif getattr(data, "url", None):
                import urllib.request
                urllib.request.urlretrieve(data.url, str(gen_path))
                return gen_path
        except Exception:
            continue
    return None


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
