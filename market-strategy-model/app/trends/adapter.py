import uuid
from datetime import datetime, timezone

import httpx

from app.config import get_settings
from app.db.models import ShopProfile, TrendSearchRecord


def _get_demo_fallback_trends(topic: str, category: str = "Retail") -> dict:
    clean_topic = topic.strip().lower()
    sample_keywords = [
        f"artisan {clean_topic}",
        f"custom {clean_topic}",
        f"organic {clean_topic}",
        f"aesthetic {clean_topic}",
        f"local {clean_topic} gift boxes",
    ]
    scores = {
        sample_keywords[0]: 86.5,
        sample_keywords[1]: 78.2,
        sample_keywords[2]: 72.0,
        sample_keywords[3]: 64.8,
        sample_keywords[4]: 58.4,
    }
    reliability = {
        kw: {
            "score": round(80.0 - idx * 4.5, 1),
            "coverage": 1.0,
            "non_zero_ratio": 0.95,
            "stability": round(0.85 - idx * 0.05, 2),
            "trend_signal": round(0.75 - idx * 0.08, 2),
        }
        for idx, kw in enumerate(sample_keywords)
    }
    return {
        "status": "demo_fallback",
        "topic": topic,
        "keywords": sample_keywords,
        "results": scores,
        "reliability": reliability,
        "analysis": {
            "total_keywords_analyzed": len(sample_keywords),
            "top_10": [
                {
                    "keyword": kw,
                    "score": scores[kw],
                    "reliability_score": reliability[kw]["score"],
                }
                for kw in sample_keywords
            ],
            "bottom_5": [],
            "reliability_summary": {
                "avg_reliability": 72.5,
                "min_reliability": 62.0,
                "max_reliability": 80.0,
            },
        },
        "product_images": {
            kw: [
                {
                    "thumbnail": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=60",
                    "title": f"Popular {kw} showcase",
                    "source": "demo_catalog",
                }
            ]
            for kw in sample_keywords
        },
        "trends_meta": {
            "provider": "demo_fixture",
            "engine": "google_trends_simulation",
            "timeline_points": 12,
            "provenance": "demo_fallback",
            "reason": "Flask Trend Finder at http://127.0.0.1:5000 was offline or unreachable. Displaying demonstration dataset.",
        },
        "demo": True,
    }


async def search(session, user_id: str, payload: dict, profile: dict) -> tuple[TrendSearchRecord, dict]:
    settings = get_settings()
    request_payload = {
        "business": payload["topic"],
        "topic": payload["topic"],
        "profile": profile,
        "filters": payload.get("filters", {}),
    }
    search_id = f"search-{uuid.uuid4().hex}"
    result = {}
    demo = False
    error = None

    try:
        async with httpx.AsyncClient(timeout=settings.trend_finder_timeout_seconds) as client:
            response = await client.post(
                f"{settings.trend_finder_base_url.rstrip('/')}/get_trends",
                json=request_payload,
            )
            response.raise_for_status()
            result = response.json()
            demo = False
    except (httpx.HTTPError, ValueError) as exc:
        error = f"trend finder unavailable: {exc}"
        if not settings.promotion_demo_mode:
            raise
        # Demo fallback mode enabled
        demo = True
        result = _get_demo_fallback_trends(payload["topic"], profile.get("category", "Retail"))
        result["error"] = error

    record = TrendSearchRecord(
        search_id=search_id,
        user_id=user_id,
        topic=payload["topic"],
        request_json=__import__("json").dumps(request_payload),
        result_json=__import__("json").dumps(result),
        demo=demo,
        error=error,
    )
    session.add(record)
    session.commit()
    return record, result

