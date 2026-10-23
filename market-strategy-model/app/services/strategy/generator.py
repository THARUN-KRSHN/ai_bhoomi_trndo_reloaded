from datetime import datetime, timezone
from uuid import uuid4

from app.schemas.requests import BusinessRequest
from app.schemas.reports import StrategyReport


def build_report(request: BusinessRequest, evidence: list, opportunities: list, research_status: str = "no_evidence") -> StrategyReport:
    product_names = ", ".join(product.name for product in request.products_services)
    missing = []
    if any(product.unit_cost is None for product in request.products_services):
        missing.append("Unit cost is unknown; profitability cannot be asserted.")
    if research_status == "failed":
        missing.append("Live research failed; no current evidence claim is made.")
    elif not evidence:
        missing.append("No live evidence was retrieved; validate demand with a limited test.")
    if any(product.stock_or_capacity is None for product in request.products_services):
        missing.append("Stock or capacity is unknown; availability and scarcity claims are prohibited.")
    return StrategyReport(
        strategy_id=str(uuid4()), generated_at=datetime.now(timezone.utc), demo=False,
        generation_method="deterministic",
        research_status=research_status,
        business_context_summary=f"{request.category} business in {request.city}, {request.region}, offering {product_names}.",
        executive_recommendation="Run a small, measurable local test before scaling because evidence is limited.",
        recommended_decision="run_test" if evidence else "insufficient_evidence",
        business_objective=request.objective.value, target_segment=request.target_audience,
        jobs_to_be_done=["Find a suitable option", "Reduce uncertainty before purchase"],
        customer_need=f"Customers need a clear reason to choose {product_names} for their stated situation.",
        barriers=["Limited evidence of local demand", "Price and capacity information may be incomplete"],
        market_summary="Observed evidence is separated from interpretation; no historical momentum is claimed without comparable time-series data.",
        competitor_substitute_observations=["Competitor and substitute details require corroborating local sources."],
        opportunities=opportunities, primary_positioning=request.product_positioning or f"A practical local choice for {request.target_audience}.",
        value_proposition=f"{product_names} presented around the customer's stated need, in {request.primary_language}.",
        offer_recommendation="Test one clear offer with a single CTA; do not claim scarcity.",
        pricing_safeguards=["Respect the approved price floor.", "Do not claim profitability while cost is unknown."],
        channel_strategy={channel: "Test awareness and qualified response; measure attributable inquiries." for channel in (request.preferred_channels or ["local search", "messaging"])},
        campaign_steps=["Publish one localized message", "Use a trackable CTA", "Review results against the guardrails"],
        content_formats=request.preferred_content_formats or ["short video", "static post"],
        call_to_action="Message to check fit and availability.", language=request.primary_language,
        creative_direction=request.desired_tone or request.brand_personality or "Clear, helpful, and locally relevant.",
        research_resources=[item.url for item in evidence if item.source_type == "youtube"],
        source_register=[item.model_dump() for item in evidence], kpi_plan={
            "metrics": ["qualified inquiries", "conversion rate", "cost per qualified inquiry"],
            "test_hypothesis": "A localized, need-led message will generate qualified responses.",
            "comparison_method": "Compare the test period with a defined prior baseline or holdout where feasible.",
            "guardrails": ["Do not exceed budget or capacity", "Do not discount below the price floor"],
            "decision_rules": ["Scale only if the primary KPI improves without violating guardrails.", "Otherwise revise or stop."],
        },
        assumptions=["Merchant-supplied product attributes are treated as claims, not independent verification."],
        missing_information=missing, next_steps=["Confirm missing cost/capacity data", "Run the limited test", "Collect customer response evidence"],
        score_version="heuristic-v1",
    )
