from pathlib import Path

from PIL import Image

from app.payments.qr_generator import create_qr
from app.payments.upi import build_upi_uri
from app.promotion.content_generator import build_content
from app.promotion.poster_renderer import render_poster
from app.promotion.schemas import ProductSnapshot, PromotionFormat
from app.schemas.reports import StrategyReport


def strategy() -> StrategyReport:
    return StrategyReport(
        strategy_id="strategy-1",
        generated_at="2026-01-01T00:00:00Z",
        business_context_summary="Bakery in Kochi",
        executive_recommendation="Run a test",
        recommended_decision="run_test",
        business_objective="awareness",
        target_segment="Nearby families",
        jobs_to_be_done=["Find fresh bread"],
        customer_need="Fresh bread",
        barriers=["Unknown local demand"],
        market_summary="No trend claim",
        competitor_substitute_observations=[],
        opportunities=[],
        primary_positioning="Fresh local bread",
        value_proposition="Fresh bread for nearby families",
        offer_recommendation="Use one clear CTA",
        pricing_safeguards=["Do not claim profitability"],
        channel_strategy={},
        campaign_steps=[],
        content_formats=[],
        call_to_action="Message to enquire",
        language="English",
        creative_direction="Warm",
        research_resources=[],
        source_register=[],
        kpi_plan={"metrics": [], "test_hypothesis": "x", "comparison_method": "x", "guardrails": [], "decision_rules": []},
        assumptions=[],
        missing_information=[],
        next_steps=[],
        score_version="heuristic-v1",
    )


def test_poster_dimensions_and_upi_encoding(tmp_path: Path):
    content = build_content(strategy(), ProductSnapshot(name="Sourdough loaf", description="Fresh loaf", price=250), "English", ["instagram"], None, None)
    asset_id, width, height = render_poster(content, tmp_path, PromotionFormat.story)
    with Image.open(tmp_path / f"{asset_id}.png") as image:
        assert image.size == (1080, 1920)
    uri = build_upi_uri("shop@example", "Demo Shop & Sons", 250, "order/1", "INR")
    assert "am=250.00" in uri and "tn=order%2F1" in uri and "pn=Demo+Shop" in uri


def test_qr_is_created_without_gateway(tmp_path: Path):
    target = create_qr("upi://pay?pa=shop@example&am=250.00&cu=INR", tmp_path / "payment.png")
    assert target.exists()
    assert target.stat().st_size > 0
