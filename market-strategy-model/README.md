# TRNDO Intelligence backend

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

If the server raises `ModuleNotFoundError: No module named 'qrcode'` (or another declared dependency), synchronize the virtual environment used by the terminal. The package is already declared by `qrcode[pil]` in `requirements.txt`; installing the manifest is required after a new environment is created or the manifest changes:

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -c "import qrcode; from app.main import app; print('Backend imports OK')"
```

Confirm that `python -c "import sys; print(sys.executable)"` points to `market-strategy-model\.venv\Scripts\python.exe` before starting Uvicorn.

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

## Downstream promotion, orders, Telegram, and UPI module

The downstream module reuses a saved `strategy_id`; it does not create a second scoring source of truth. A live promotion request must include a strategy ID and a verified `product_snapshot`. Reports without merchant ownership metadata can only be used with the explicit development merchant (`development-merchant`) until an upstream authenticated merchant model is added.

Available endpoints:

```text
POST /api/v1/promotions/assets
GET  /api/v1/promotions/assets/{asset_id}
POST /api/v1/promotions/generate
GET  /api/v1/promotions/{promotion_id}
GET  /api/v1/promotions/{promotion_id}/assets
POST /api/v1/orders
GET  /api/v1/orders/{order_id}?merchant_id=...
POST /api/v1/orders/{order_id}/transition?merchant_id=...&status=...
POST /api/v1/orders/{order_id}/payment-instructions?merchant_id=...
GET  /api/v1/payments/qr/{order_id}?merchant_id=...
POST /api/v1/telegram/link-token?merchant_id=...
POST /api/v1/telegram/webhook
```

Promotion generation produces structured captions and deterministic PNG posters in portrait (1080x1350), square (1080x1080), or story (1080x1920) formats. Uploaded logos/product images are decoded and normalized with Pillow. Without a product photograph, the poster uses a clearly illustrative typographic panel; it does not pretend that artwork is a product photograph. Asset files are stored under `ASSET_STORAGE_DIR`, which is ignored by Git.

OpenAI Structured Outputs is used for promotion copy when `OPENAI_API_KEY` is configured. If it fails, the service returns deterministic copy and records the fallback assumption. Scores, source URLs, strategy IDs, approved product details, prices, and safety warnings remain application-owned.

Orders calculate totals on the server from the supplied verified unit price. Unknown prices remain unknown and cannot produce payment instructions. Valid transitions include inquiry, pending confirmation, confirmed, awaiting payment, payment reported, paid, ready, fulfilled, rejected, and cancelled. A customer `payment_reported` event never marks an order paid. `paid` requires independent merchant verification.

UPI uses a locally generated `upi://pay` intent and QR image. It is not a payment gateway and does not verify settlement. Configure `MERCHANT_UPI_VPA` and `MERCHANT_UPI_NAME` only for development testing; never collect a UPI PIN or bank credential.

Telegram linking uses a short-lived, single-use token and a validated webhook secret when configured. Duplicate update IDs are ignored. The webhook handles secure merchant linking, customer order updates, callback authorization, and deduplication. A local polling worker is available with `python -m app.telegram.polling`; use either polling or webhooks for a bot, never both at once. This module is not an Instagram or WhatsApp integration.

Promotion generation quota is configurable through `FREE_MONTHLY_PROMOTION_QUOTA` and `PREMIUM_MONTHLY_PROMOTION_QUOTA`. Usage is tracked per merchant and calendar month, and idempotency keys prevent duplicate charges. The current development API uses the fixture merchant identity until authentication is added.

The execution-layer environment names are also supported: `OPENAI_TEXT_MODEL`, optional `OPENAI_IMAGE_MODEL`, `ENABLE_AI_BACKGROUND_ART`, `TELEGRAM_MODE`, `TELEGRAM_OWNER_CHAT_ID`, `UPI_MERCHANT_VPA`, `UPI_PAYEE_NAME`, `PAYMENT_CURRENCY`, `PUBLIC_BASE_URL`, `PAYMENT_TOKEN_TTL_HOURS`, `PROMOTION_STORAGE_DIR`, `MAX_UPLOAD_MB`, `PROMOTION_DEMO_MODE`, and `DEFAULT_MONTHLY_PROMOTION_LIMIT`. Existing `OPENAI_MODEL`, `MERCHANT_UPI_VPA`, `MERCHANT_UPI_NAME`, and `ASSET_STORAGE_DIR` remain valid for backward compatibility. Telegram polling and webhook delivery are mutually exclusive deployment modes; the current endpoint implements secure webhook linking and deduplication, while a polling worker remains a separate operational process to add.

Install the downstream dependencies and run:

```powershell
pip install -r requirements.txt
python -m pytest -q
python -m compileall app tests
```

## Frontend integration

The sibling `frontend` directory contains the Next.js Marketing Studio. Start the backend first, then run the frontend with:

```powershell
Set-Location ..\frontend
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

The frontend uses `NEXT_PUBLIC_API_BASE_URL` to call this backend. The strategy report route links into `/marketing-studio/create?strategy={strategy_id}`, preserving the approved strategy as the source of truth.

The frontend currently connects to promotion generation/retrieval, Telegram promotion delivery, order lookup and transitions, and UPI payment-instruction routes. The backend does not yet provide list endpoints for strategies, promotions, conversations, or orders, nor a Telegram message-send endpoint; the frontend exposes those limitations explicitly.

For a local poster test, first create or retrieve a strategy report, then call `/api/v1/promotions/generate` with `strategy_id`, `merchant_id=development-merchant`, and a verified `product_snapshot`. Use the returned asset URL to download the PNG. To test payment instructions, configure a valid development VPA, create an order with a known price, transition it to `confirmed`, and call the payment-instructions endpoint. The QR only encodes the intent; do not make a real payment during testing.
