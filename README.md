# TRNDO AI

TRNDO AI is a local-first marketing workspace for small businesses. It combines an evidence-grounded market strategy backend with a visual Marketing Studio for turning an approved strategy into promotional creatives, Telegram enquiries, orders, and payment instructions.

## Repository structure

```text
ai_bhoomi/
├── trendo-ai/                # Existing Flask trend-discovery dashboard
├── market-strategy-model/   # FastAPI backend, strategy engine, promotion/order services
└── frontend/                 # Next.js Marketing Studio and Market Strategy UI
```

The backend remains the source of truth for strategy scoring, evidence, promotion generation, order totals, state transitions, and UPI instructions. The frontend does not invent market claims or payment confirmations.

## Requirements

- Python 3.12+ recommended for the backend
- Node.js 20+ and npm for the frontend
- Optional provider credentials: OpenAI, Tavily, YouTube Data API
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

## Main frontend flows

- `/market-strategy` — existing strategy workflow.
- `/market-strategy/report/{strategy_id}` — strategy report with `Create Promotion`.
- `/marketing-studio` — Marketing Studio home.
- `/marketing-studio/create` — strategy-linked poster and caption generation.
- `/marketing-studio/creations` — saved browser creation gallery.
- `/marketing-studio/inbox` — Telegram enquiry surface.
- `/marketing-studio/orders` — order and payment-instruction surface.

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

## Important limitations

- Demo mode is explicitly labelled and must not send real Telegram messages or create real payment requests.
- The current backend does not yet provide strategy-list, promotion-list, Telegram conversation-list, Telegram message-send, or order-list endpoints.
- Phone/PIN authentication, Argon2id PIN hashing, expiring bearer sessions, persistent shop profiles, and an authenticated Trend Finder adapter are now available in the FastAPI backend. The frontend authentication/onboarding screens and full cross-account authorization wiring are still the next integration phase.
- UPI QR generation creates payment instructions only; it does not verify settlement.
- Telegram polling and webhook delivery must not run simultaneously for the same bot.
- Authentication and tenant isolation are still required before production deployment.

See [market-strategy-model/README.md](./market-strategy-model/README.md) for backend configuration and [frontend/README.md](./frontend/README.md) for frontend routes and integration details.
