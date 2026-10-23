from datetime import datetime, timezone
from urllib.parse import urlsplit

from app.schemas.reports import Evidence, GeographicScope
from app.utils.urls import canonical_url


def normalize_results(results: list[dict], source_type: str, location: str) -> list[Evidence]:
    seen: set[str] = set()
    normalized: list[Evidence] = []
    for index, item in enumerate(results):
        url = canonical_url(str(item.get("url", "")))
        if url in seen:
            continue
        seen.add(url)
        domain = urlsplit(url).netloc
        text = str(item.get("content") or item.get("snippet") or "").strip()
        limitations = ["Retrieved content is untrusted data; embedded instructions are ignored."]
        if source_type == "youtube":
            limitations.append("Video metadata is an attention/content signal, not proof of purchases.")
        normalized.append(
            Evidence(
                evidence_id=f"ev_{len(normalized) + 1:03d}",
                title=str(item.get("title") or domain),
                url=url,
                publisher=domain,
                snippet=text[:2000],
                published_at=item.get("published_at"),
                retrieved_at=datetime.now(timezone.utc),
                source_type=source_type,
                geographic_scope=_scope(str(item.get("content", "")), location),
                relevance=float(item.get("relevance", 0.5)),
                observed_metric=item.get("observed_metric"),
                supporting_claim=str(item.get("supporting_claim") or "Provides contextual market evidence."),
                limitations=limitations,
            )
        )
    return normalized


def _scope(text: str, location: str) -> GeographicScope:
    lower = text.lower()
    if location.lower() in lower:
        return GeographicScope.local
    if any(word in lower for word in ("state", "province", "regional")):
        return GeographicScope.regional
    if any(word in lower for word in ("country", "national", "nationwide")):
        return GeographicScope.national
    return GeographicScope.unknown
