import json

from openai import AsyncOpenAI

from app.schemas.requests import BusinessRequest
from app.schemas.reports import Evidence, StrategyReport
from app.services.strategy.prompts import SYSTEM_PROMPT


async def refine_report(
    client: AsyncOpenAI,
    model: str,
    request: BusinessRequest,
    evidence: list[Evidence],
    calculated_report: StrategyReport,
) -> StrategyReport:
    """Use Structured Outputs for narrative refinement without delegating scoring."""
    response = await client.responses.parse(
        model=model,
        input=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    "Create the strategy report from this merchant context and evidence. "
                    "Keep all application-calculated opportunity dimensions, priority_score, "
                    "momentum, decision, score_version, and source_register unchanged. "
                    "Do not add claims without an evidence_id. Return the complete report.\n"
                    f"Merchant context:\n{request.model_dump_json()}\n"
                    f"Evidence:\n{json.dumps([item.model_dump(mode='json') for item in evidence])}\n"
                    f"Calculated report:\n{calculated_report.model_dump_json()}"
                ),
            },
        ],
        text_format=StrategyReport,
    )
    if response.output_parsed is None:
        raise ValueError("OpenAI returned no structured strategy report")
    parsed = response.output_parsed
    parsed.generation_method = "openai_responses_structured_outputs"
    parsed.opportunities = calculated_report.opportunities
    parsed.source_register = calculated_report.source_register
    parsed.research_resources = calculated_report.research_resources
    parsed.score_version = calculated_report.score_version
    return parsed
