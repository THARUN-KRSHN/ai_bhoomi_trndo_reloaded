import pytest
import httpx

from app.schemas.requests import BusinessRequest
from app.services.strategy.pipeline import generate_strategy
from app.services.strategy.scoring import calculate_priority, classify
from app.services.research.evidence_normalizer import normalize_results


def test_score_boundaries_and_missing_demand():
    assert calculate_priority(100, 100, 100, 100, 100) == 100
    assert calculate_priority(None, 100, 100, 100, 100) is None
    assert classify(None, 0).decision == "insufficient_evidence"
    assert classify(74, 2, "medium").decision == "run_test"
    assert classify(75, 2, "high").decision == "pursue"
    assert classify(90, 2, "low").decision == "run_test"


def test_urls_deduplicate_and_timestamp_remains_unknown():
    result = normalize_results([{"url": "https://Example.com/a/", "title": "A", "content": "x"}, {"url": "https://example.com/a", "title": "duplicate"}], "web", "Kochi")
    assert len(result) == 1
    assert result[0].published_at is None
    assert "untrusted data" in result[0].limitations[0]


def _request() -> BusinessRequest:
    return BusinessRequest(
        category="bakery",
        city="Kochi",
        region="Kerala",
        country="India",
        primary_language="English",
        products_services=[{"name": "Bread", "description": "Fresh bread"}],
        target_audience="Nearby families",
        objective="awareness",
        campaign_time_horizon="14 days",
    )


class EmptyTavily:
    async def search(self, queries):
        return []


class ViralYouTube:
    configured = True

    async def search(self, query):
        return [{"url": "https://youtube.com/watch?v=1", "title": "Viral bread video", "content": "1m views"}]


@pytest.mark.asyncio
async def test_youtube_signal_without_web_demand_is_insufficient():
    report = await generate_strategy(_request(), EmptyTavily(), ViralYouTube())
    opportunity = report.opportunities[0]
    assert opportunity.momentum is None
    assert opportunity.priority_score is None
    assert opportunity.decision == "insufficient_evidence"
    assert report.research_resources


class NationalTavily:
    async def search(self, queries):
        return [
            {
                "url": "https://example.com/market",
                "title": "National market report",
                "content": "National demand is increasing.",
                "relevance": 1,
            },
            {
                "url": "https://other.example/market",
                "title": "Regional market report",
                "content": "National interest remains strong.",
                "relevance": 1,
            },
        ]


class DisabledYouTube:
    configured = False


@pytest.mark.asyncio
async def test_national_evidence_does_not_claim_local_fit():
    report = await generate_strategy(_request(), NationalTavily(), DisabledYouTube())
    opportunity = report.opportunities[0]
    assert opportunity.evidence_confidence == "medium"
    assert any("does not establish demand in Kochi" in item for item in opportunity.limitations)
    assert opportunity.momentum is None


class FailingTavily:
    async def search(self, queries):
        raise httpx.ReadTimeout("research timeout")


@pytest.mark.asyncio
async def test_tavily_failure_is_visible_and_not_live_evidence():
    report = await generate_strategy(_request(), FailingTavily(), DisabledYouTube())
    assert report.research_status == "failed"
    assert report.recommended_decision == "insufficient_evidence"
    assert any("research failed" in item.lower() for item in report.missing_information)
