import json
from pydantic import BaseModel
from openai import AsyncOpenAI

from app.schemas.requests import BusinessRequest
from app.schemas.reports import Evidence, StrategyReport
from app.services.strategy.prompts import SYSTEM_PROMPT


class StrategyNarrativeRefinement(BaseModel):
    business_context_summary: str
    executive_recommendation: str
    target_segment: str
    jobs_to_be_done: list[str]
    customer_need: str
    barriers: list[str]
    market_summary: str
    competitor_substitute_observations: list[str]
    primary_positioning: str
    value_proposition: str
    offer_recommendation: str
    pricing_safeguards: list[str]
    campaign_steps: list[str]
    content_formats: list[str]
    call_to_action: str
    creative_direction: str
    assumptions: list[str]
    next_steps: list[str]


async def refine_report(
    client: AsyncOpenAI,
    model: str,
    request: BusinessRequest,
    evidence: list[Evidence],
    calculated_report: StrategyReport,
) -> StrategyReport:
    """Use Structured Outputs for narrative refinement while keeping scoring intact."""
    prompt_content = (
        "Generate a strategic retail marketing narrative for this merchant.\n"
        f"Merchant Business Context:\n{request.model_dump_json()}\n"
        f"Retrieved Market Evidence:\n{json.dumps([item.model_dump(mode='json') for item in evidence])}\n"
        "Explain the strategic positioning, customer demand story, and launch playbook clearly and practically for this specific merchant."
    )

    response = await client.responses.parse(
        model=model,
        input=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt_content},
        ],
        text_format=StrategyNarrativeRefinement,
    )

    if response.output_parsed is None:
        raise ValueError("OpenAI returned no structured strategy narrative")

    narrative = response.output_parsed

    # Merge narrative fields into the calculated report
    calculated_report.business_context_summary = narrative.business_context_summary
    calculated_report.executive_recommendation = narrative.executive_recommendation
    calculated_report.target_segment = narrative.target_segment
    calculated_report.jobs_to_be_done = narrative.jobs_to_be_done
    calculated_report.customer_need = narrative.customer_need
    calculated_report.barriers = narrative.barriers
    calculated_report.market_summary = narrative.market_summary
    calculated_report.competitor_substitute_observations = narrative.competitor_substitute_observations
    calculated_report.primary_positioning = narrative.primary_positioning
    calculated_report.value_proposition = narrative.value_proposition
    calculated_report.offer_recommendation = narrative.offer_recommendation
    calculated_report.pricing_safeguards = narrative.pricing_safeguards
    calculated_report.campaign_steps = narrative.campaign_steps
    calculated_report.content_formats = narrative.content_formats
    calculated_report.call_to_action = narrative.call_to_action
    calculated_report.creative_direction = narrative.creative_direction
    calculated_report.assumptions = narrative.assumptions
    calculated_report.next_steps = narrative.next_steps
    calculated_report.generation_method = "openai_responses_structured_outputs"
    calculated_report.demo = False

    # Also update the primary opportunity title to match the actual product/positioning
    if calculated_report.opportunities:
        first_prod = request.products_services[0].name if request.products_services else request.category
        calculated_report.opportunities[0].title = f"{first_prod} — Targeted Demand Strategy"

    return calculated_report
