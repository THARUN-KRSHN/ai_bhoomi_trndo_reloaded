import httpx
from openai import APIError, AsyncOpenAI

from app.config import get_settings
from app.schemas.requests import BusinessRequest
from app.services.research.evidence_normalizer import normalize_results
from app.services.research.tavily_provider import TavilyProvider
from app.services.research.youtube_provider import YouTubeProvider
from app.services.strategy.generator import build_report
from app.services.strategy.llm_generator import refine_report
from app.services.strategy.scoring import calculate_priority, classify, evidence_confidence


async def generate_strategy(request: BusinessRequest, tavily: TavilyProvider, youtube: YouTubeProvider):
    queries = [
        f"{request.category} customer needs {request.city} {request.primary_language}",
        f"{request.category} market discussion substitutes {request.region}",
        f"{request.category} competitors pricing {request.city}",
        f"{request.category} seasonality {request.region}",
        f"{request.category} {request.objective.value} buying barriers",
        f"{request.category} marketing creative educational examples",
    ]
    research_status = "unavailable"
    try:
        raw = await tavily.search(queries)
    except (httpx.HTTPError, TimeoutError):
        raw = []
        research_status = "failed"

    evidence = normalize_results(raw, "web", request.city) if raw else []
    if evidence:
        research_status = "live"
    if youtube.configured:
        try:
            video_results = await youtube.search(f"{request.category} {request.city}")
            evidence.extend(normalize_results(video_results, "youtube", request.city))
        except (httpx.HTTPError, TimeoutError):
            pass

    fit = 65.0
    commercial = 60.0 if any(item.price is not None for item in request.products_services) else 40.0
    execution = 65.0 if request.preferred_channels else 45.0
    demand_evidence = [item for item in evidence if item.source_type == "web"]
    demand = (
        min(100.0, 45.0 + 20.0 * sum(item.relevance for item in demand_evidence))
        if demand_evidence
        else None
    )
    confidence, limitations = evidence_confidence(evidence, request.city)
    priority = calculate_priority(demand, fit, 55.0, commercial, execution)
    classified = classify(priority, len(demand_evidence), confidence)
    opportunity = {
        "title": f"{request.category} need-led local test",
        "demand_evidence_ids": [item.evidence_id for item in demand_evidence],
        "momentum": None,
        "momentum_reason": "No comparable historical time series was supplied.",
        "durability": "insufficient_data",
        "shop_fit": fit,
        "differentiation": 55.0,
        "commercial_feasibility": commercial,
        "execution_feasibility": execution,
        "priority_score": classified.value,
        "evidence_confidence": classified.confidence,
        "limitations": limitations
        + (
            ["Heuristic weights are not probabilities."]
            if priority is not None
            else ["Essential demand evidence is missing."]
        ),
        "decision": classified.decision,
    }
    report = build_report(request, evidence, [opportunity], research_status)
    settings = get_settings()
    if settings.openai_api_key:
        try:
            report = await refine_report(
                AsyncOpenAI(api_key=settings.openai_api_key),
                settings.openai_model,
                request,
                evidence,
                report,
            )
        except (APIError, httpx.HTTPError, TimeoutError, ValueError):
            report.assumptions.append(
                "Structured strategy refinement was unavailable; deterministic output was returned."
            )
    return report
