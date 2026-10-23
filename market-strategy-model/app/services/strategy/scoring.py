from dataclasses import dataclass

from app.config import DEFAULT_SCORE_WEIGHTS

SCORE_VERSION = "heuristic-v1"
WEIGHTS = DEFAULT_SCORE_WEIGHTS


@dataclass(frozen=True)
class Score:
    value: float | None
    decision: str
    confidence: str


def calculate_priority(demand_evidence: float | None, shop_fit: float, differentiation: float, commercial_feasibility: float, execution_feasibility: float) -> float | None:
    values = (demand_evidence, shop_fit, differentiation, commercial_feasibility, execution_feasibility)
    if demand_evidence is None or any(not 0 <= value <= 100 for value in values if value is not None):
        return None
    return round(sum(weight * value for weight, value in zip(WEIGHTS.values(), values)), 2)


def classify(score: float | None, evidence_count: int, confidence: str = "low") -> Score:
    if score is None or evidence_count == 0:
        return Score(None, "insufficient_evidence", "low")
    if confidence == "low":
        return Score(score, "monitor" if score < 55 else "run_test", confidence)
    if score >= 75:
        return Score(score, "pursue", confidence)
    if score >= 55:
        return Score(score, "run_test", confidence)
    return Score(score, "monitor", confidence)


def evidence_confidence(evidence: list, location: str) -> tuple[str, list[str]]:
    if not evidence:
        return "low", ["No corroborating market evidence was retrieved."]
    web = [item for item in evidence if item.source_type == "web"]
    corroborated = len({item.publisher for item in web}) >= 2
    local = any(item.geographic_scope.value == "local" for item in web)
    national_only = bool(web) and all(item.geographic_scope.value in {"national", "unknown"} for item in web)
    conflicts = any("conflict" in item.supporting_claim.lower() for item in web)
    limitations: list[str] = []
    if not corroborated:
        limitations.append("Evidence is not independently corroborated.")
    if national_only:
        limitations.append(f"Evidence does not establish demand in {location}.")
    if conflicts:
        limitations.append("Sources contain conflicting observations; confidence is downgraded.")
    if conflicts or not corroborated:
        return "low", limitations
    return ("high" if local else "medium"), limitations
