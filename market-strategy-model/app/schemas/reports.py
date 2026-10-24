from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, HttpUrl


class GeographicScope(str, Enum):
    national = "national"
    regional = "regional"
    local = "local"
    unknown = "unknown"


class Evidence(BaseModel):
    evidence_id: str
    title: str
    url: str
    publisher: str
    snippet: str
    published_at: datetime | None = None
    retrieved_at: datetime
    source_type: str
    geographic_scope: GeographicScope = GeographicScope.unknown
    relevance: float = Field(ge=0, le=1)
    observed_metric: str | None = None
    supporting_claim: str
    limitations: list[str] = Field(default_factory=list)


class Decision(str, Enum):
    pursue = "pursue"
    run_test = "run_test"
    monitor = "monitor"
    no_action = "no_action"
    insufficient_evidence = "insufficient_evidence"


class Opportunity(BaseModel):
    title: str
    demand_evidence_ids: list[str]
    momentum: float | None = Field(default=None, ge=0, le=100)
    momentum_reason: str
    durability: str
    shop_fit: float = Field(ge=0, le=100)
    differentiation: float = Field(ge=0, le=100)
    commercial_feasibility: float = Field(ge=0, le=100)
    execution_feasibility: float = Field(ge=0, le=100)
    priority_score: float | None = Field(default=None, ge=0, le=100)
    evidence_confidence: str
    limitations: list[str]
    decision: Decision


class SourceRegisterItem(BaseModel):
    evidence_id: str
    url: str
    publisher: str
    published_at: datetime | None
    retrieved_at: datetime
    geographic_scope: GeographicScope
    supporting_claim: str
    limitations: list[str]


class KPIPlan(BaseModel):
    metrics: list[str]
    test_hypothesis: str
    comparison_method: str
    guardrails: list[str]
    decision_rules: list[str]


class StrategyReport(BaseModel):
    strategy_id: str
    generated_at: datetime
    demo: bool = False
    generation_method: str = "deterministic"
    research_status: str = "no_evidence"
    business_context_summary: str
    executive_recommendation: str
    recommended_decision: Decision
    business_objective: str
    target_segment: str
    jobs_to_be_done: list[str]
    customer_need: str
    barriers: list[str]
    market_summary: str
    competitor_substitute_observations: list[str]
    opportunities: list[Opportunity] = Field(max_length=3)
    primary_positioning: str
    value_proposition: str
    offer_recommendation: str
    pricing_safeguards: list[str]
    channel_strategy: dict[str, str]
    campaign_steps: list[str]
    content_formats: list[str]
    call_to_action: str
    language: str
    creative_direction: str
    research_resources: list[str]
    source_register: list[SourceRegisterItem]
    kpi_plan: KPIPlan
    assumptions: list[str]
    missing_information: list[str]
    next_steps: list[str]
    score_version: str
