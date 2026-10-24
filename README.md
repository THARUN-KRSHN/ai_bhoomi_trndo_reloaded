# TRNDO AI

TRNDO AI is a local-first marketing workspace for small businesses. It combines an evidence-grounded market strategy backend with a visual Marketing Studio for turning an approved strategy into promotional creatives, Telegram enquiries, orders, and payment instructions.

## Product overview

TRNDO is one product implemented as three independently runnable services:

1. **Trend Finder** discovers current search and web signals using the existing
   Flask application. It preserves the existing trend scoring and SerpApi
   integration.
2. **Market Strategy API** is the central FastAPI service. It owns accounts,
   shop profiles, trend-search persistence, evidence handling, deterministic
   opportunity scoring, structured strategy generation, promotions, orders,
   Telegram integration, and UPI payment instructions.
3. **Frontend** is the Next.js application. It provides registration,
   onboarding, authenticated trend discovery, strategy reports, Marketing
   Studio, promotion galleries, inbox, and order workflows.

The frontend calls FastAPI. FastAPI calls Flask for trend discovery. The
browser never calls provider APIs directly and never receives provider
credentials.

## Repository structure

```text
ai_bhoomi/
├── trendo-ai/                # Existing Flask trend-discovery dashboard
├── market-strategy-model/   # FastAPI backend, strategy engine, promotion/order services
└── frontend/                 # Next.js Marketing Studio and Market Strategy UI
```

The backend remains the source of truth for strategy scoring, evidence, promotion generation, order totals, state transitions, and UPI instructions. The frontend does not invent market claims or payment confirmations.

## Request flow

```text
Browser
  │
  ├── account/profile/trend/strategy/promotion/order requests
  ▼
Next.js frontend ── authenticated HTTP ──► FastAPI Strategy API
                                             │
                                             ├── PostgreSQL or SQLite
                                             ├── OpenAI Responses API
                                             ├── Tavily
                                             ├── YouTube Data API
                                             └── HTTP adapter ──► Flask Trend Finder
                                                                    │
                                                                    ├── Groq
                                                                    ├── SerpApi
                                                                    └── Gemini
```

Trend articles, search results, and video metadata are evidence or attention
signals. They are not treated as quantitative momentum. Momentum is returned
as unavailable unless comparable historical observations are provided.

## Requirements

- Python 3.12+ recommended for the backend
- Node.js 20+ and npm for the frontend
- Optional provider credentials: OpenAI, Tavily, YouTube Data API
- Optional Gemini credential in the Flask Trend Finder for category-aware onboarding suggestions
- Optional Telegram bot and merchant UPI configuration

## Run the integrated product

TRNDO AI is composed of one product with three local services:

| Service | URL | Responsibility |
|---|---|---|
| Flask Trend Discovery | `http://127.0.0.1:5000` | Groq keyword generation, SerpApi trend signals, image discovery |
| FastAPI Strategy API | `http://127.0.0.1:8000` | Evidence-grounded strategy, promotions, Telegram, orders, UPI |
| Next.js Marketing Studio | `http://localhost:3000` | Main user interface for strategy and promotion workflows |

Start the FastAPI and Next.js services as described below, then start the existing Flask dashboard:

```powershell
Set-Location .\trendo-ai
python -m pip install -r requirements.txt
python app.py
```

The Flask dashboard now contains an `Open Marketing Studio` bridge at `/marketing-studio` and an integration status endpoint at `/integration/status`. The bridge keeps Trend Discovery and Marketing Studio in the same TRNDO workflow without duplicating the strategy engine.

## Deployment order

Deploy the services in this order so each public URL is available for the next
service's environment variables:

1. Flask Trend Finder on Render.
2. FastAPI Strategy API on Render.
3. Next.js frontend on Vercel.

Use the deployment settings documented in the service READMEs. After each
deployment, verify `/health` before continuing. Do not use localhost URLs in
production environment variables.

Render's local filesystem is ephemeral. For a production FastAPI deployment,
attach a Render Postgres database and set `DATABASE_URL`; use a persistent disk
or object storage for generated promotion assets. SQLite and local storage are
acceptable only for a disposable demo.

## Run the FastAPI backend

```powershell
Set-Location .\market-strategy-model
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

If startup reports `ModuleNotFoundError` for a package such as `qrcode`, the active virtual environment was created before the dependency manifest was updated. From the backend directory, synchronize the active environment and retry:

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -c "import qrcode; from app.main import app; print('Backend imports OK')"
```

Backend URLs:

- Swagger UI: <http://127.0.0.1:8000/docs>
- Health: <http://127.0.0.1:8000/health>
- Provider status: <http://127.0.0.1:8000/api/v1/providers/status>

Put real credentials only in the ignored `.env` file. Never place secrets in `.env.example`, frontend source, or commits.

## Run the frontend

```powershell
Set-Location .\frontend
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

Open <http://localhost:3000>. The frontend uses `NEXT_PUBLIC_API_BASE_URL` for the backend URL and `NEXT_PUBLIC_ENABLE_DEMO_DATA` for explicit demo fallback behavior. Browser-exposed variables must never contain API keys or Telegram secrets.

If Next.js reports `Could not validate that a segment in your UI has instant navigation`,
ensure the checked-in frontend configuration has `cacheComponents: false`. The current
interactive routes depend on browser authentication state and are intentionally run
without instant-navigation validation until those routes are migrated to the cache
components model.

## Main frontend flows

- `/market-strategy` — existing strategy workflow.
- `/market-strategy/report/{strategy_id}` — strategy report with `Create Promotion`.
- `/marketing-studio` — Marketing Studio home.
- `/marketing-studio/create` — strategy-linked poster and caption generation.
- `/marketing-studio/creations` — saved browser creation gallery.
- `/marketing-studio/inbox` — Telegram enquiry surface.
- `/marketing-studio/orders` — order and payment-instruction surface.
- `/onboarding` — guided category-aware profile setup with generated selection pills; it can be skipped and completed later.
- `/trends` — authenticated Trend Finder search and strategy linking.

## Validation

Backend:

```powershell
Set-Location .\market-strategy-model
python -m pytest -q
python -m compileall app tests
```

Frontend:

```powershell
Set-Location .\frontend
npx tsc --noEmit
npm run build
npx eslint src/app/marketing-studio src/components/marketing src/lib/api/client.ts src/lib/api/types.ts --quiet
```

The validation commands should be run from the respective project directories. Do not use a globally installed Python or a different virtual environment when validating the backend.

The production gate is `npm run build` plus `npx tsc --noEmit`; both must pass
before deploying the frontend. The repository currently has known ESLint
diagnostics in older interactive pages, primarily React
`set-state-in-effect` warnings promoted to errors and unused imports. These
should be cleaned up in a dedicated frontend lint pass rather than hidden with
global rule suppression.

## Environment ownership

| Variable type | Service | Exposed to browser |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Vercel frontend | Yes |
| `NEXT_PUBLIC_ENABLE_DEMO_DATA` | Vercel frontend | Yes |
| OpenAI, Tavily, YouTube, Telegram, UPI | FastAPI Render service | No |
| `DATABASE_URL` | FastAPI Render service | No |
| Groq, SerpApi, Gemini | Flask Render service | No |

Use `.env.example` files as templates only. Local `.env` files are ignored and
must never be committed. Rotate any credential that was accidentally pasted
into chat, logs, screenshots, or a repository.

## Production checklist

- Deploy Flask, then FastAPI, then Vercel so dependent public URLs are known.
- Set FastAPI `TREND_FINDER_BASE_URL` to the deployed Flask URL.
- Set FastAPI `ALLOWED_ORIGINS` to the exact Vercel origin without a trailing
  slash.
- Set FastAPI `PUBLIC_BASE_URL` to the public FastAPI URL.
- Use Render Postgres through `DATABASE_URL`; default Render filesystem
  storage is not durable.
- Configure persistent storage or object storage for generated promotion
  assets.
- Set `NEXT_PUBLIC_ENABLE_DEMO_DATA=false` for live-only frontend behavior.
- Use HTTPS for every deployed service and verify `/health` after each deploy.
- Configure either Telegram webhook delivery or polling, never both for the
  same bot.
- Add phone ownership verification, rate limiting, secure HTTP-only cookies,
  CSRF protection, and database migrations before treating the MVP as a
  security-complete production system.

## Troubleshooting

- **Frontend says “Failed to fetch”:** confirm the Vercel
  `NEXT_PUBLIC_API_BASE_URL` points to FastAPI, redeploy Vercel after changing
  it, and confirm FastAPI `ALLOWED_ORIGINS` exactly matches the Vercel origin.
- **FastAPI cannot reach trends:** confirm `TREND_FINDER_BASE_URL` points to
  Flask and that Flask `/health` responds publicly.
- **FastAPI restarts or loses data:** replace SQLite with Render Postgres and
  configure durable asset storage.
- **Category options are empty:** restart/redeploy Flask after changing its
  environment or source; the endpoint has generic fallbacks when Gemini is
  unavailable.
- **Telegram assets do not open:** set `PUBLIC_BASE_URL` to the public FastAPI
  URL and ensure the asset storage is reachable by the running service.

## Important limitations

- Demo mode is explicitly labelled and must not send real Telegram messages or create real payment requests.
- Phone/PIN authentication, Argon2id PIN hashing, expiring bearer sessions, persistent shop profiles, authenticated Trend Finder search, strategy-from-trend linking, order listing, and Telegram conversation status are available.
- The frontend includes registration, login, three-step onboarding, protected workspaces, and `/trends`. The prototype uses bearer tokens in session storage because the existing API contract is bearer-based; production should migrate to secure HTTP-only cookies with CSRF protection.
- Phone ownership verification/OTP is not implemented and must be added before production account recovery or identity claims.
- UPI QR generation creates payment instructions only; it does not verify settlement.
- Telegram polling and webhook delivery must not run simultaneously for the same bot.
- Authentication and tenant isolation are still required before production deployment.

See [market-strategy-model/README.md](./market-strategy-model/README.md) for backend configuration and [frontend/README.md](./frontend/README.md) for frontend routes and integration details.
