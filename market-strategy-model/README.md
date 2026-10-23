# TRNDO Intelligence

TRNDO Intelligence is a runnable FastAPI middle-layer MVP for evidence-grounded market strategy generation. It uses deterministic scoring, optional Tavily/YouTube connectors, and OpenAI Responses API Structured Outputs for narrative strategy interpretation. Live research is never represented when a provider is unavailable. The demo report is explicitly marked `demo: true`.

## Setup

### Ubuntu/Linux
```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

### Windows PowerShell
```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

Create API keys in the Tavily dashboard, Google Cloud Console (enable YouTube Data API v3), and the OpenAI platform. Put them only in `.env`; provider status exposes configuration state, never secrets. The SQLite database is initialized automatically on startup.

The supported environment contract is `APP_ENV`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `TAVILY_API_KEY`, optional `YOUTUBE_API_KEY`, `DATABASE_URL`, `MAX_WEB_RESULTS`, `MAX_YOUTUBE_RESULTS`, `CACHE_TTL_SECONDS`, `REQUEST_TIMEOUT_SECONDS`, and comma-separated `ALLOWED_ORIGINS`. Set `OPENAI_MODEL` to a model available to your API project; it is intentionally blank in `.env.example`.

Visit `http://127.0.0.1:8000/docs`. Demo:
```bash
curl -X POST http://127.0.0.1:8000/api/v1/strategy/demo
```
Generation accepts the request schema at `/api/v1/strategy/generate`; retrieval is available at `/api/v1/strategy/{strategy_id}`. Run tests with `pytest`.

## Strategy algorithm

The reproducible pipeline profiles the merchant, creates context-specific research queries, normalizes and deduplicates evidence, evaluates an opportunity with the configured `heuristic-v1` weights, formulates a STP/JTBD-informed experiment, and validates the structured report. The default weights are demand evidence 25%, shop fit 25%, differentiation 15%, commercial feasibility 20%, and execution feasibility 15%.

Scores from 75-100 may be pursued only when evidence confidence is adequate, scores from 55-74 become limited experiments, and lower scores are monitored or reworked. Missing demand evidence produces `insufficient_evidence` rather than an authoritative score. A high shop-fit score cannot override weak demand evidence or conflicting sources.

Momentum is `null` and durability is `insufficient_data` unless comparable historical observations are supplied. YouTube items are content/attention signals and are never counted as demand evidence by themselves. National evidence is labeled geographically limited when local fit is unknown. Tavily failure is exposed through `research_status=failed`; YouTube failure leaves the strategy usable without video resources. Unknown cost prevents profitability claims, and unknown stock/capacity prevents availability or scarcity claims. Retrieved text is untrusted data and embedded instructions are not followed.

## Limitations and production notes

The application calculates opportunity scores; the model cannot invent or override those values. OpenAI refinement is schema-constrained and falls back to the deterministic report if the provider is unavailable. Trend momentum remains `null` and durability remains `insufficient_data` unless a permitted, comparable historical time series is supplied. Recent web articles, search results, and YouTube metadata are current signals or attention/context signals, not quantitative trend growth or purchase proof. This MVP intentionally does not depend on the limited Google Trends API alpha. Production requires authentication, tenant isolation, rate limiting, encrypted secrets, migrations, provider caching, observability, and stronger persistence controls. Network failures produce cautious no-evidence behavior rather than fabricated evidence.
