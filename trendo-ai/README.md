# TRNDO Trend Finder

This Flask service is the Trend Discovery layer of the integrated TRNDO AI
product. It remains separate from the FastAPI strategy backend and provides
current trend signals without replacing the strategy engine's scoring logic.

## Run locally

```powershell
Set-Location "C:\Users\THARUN KRISHNA CU\OneDrive\Desktop\ai_bhoomi\trendo-ai"
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

The service runs at `http://127.0.0.1:5000`.

## Deploy on Render

Create a **Web Service** with this repository and set **Root Directory** to
`trendo-ai`.

```text
Build Command:  pip install -r requirements.txt
Start Command: gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 4 app:app
Health Check:  /health
```

Set these Render environment variables:

```env
GROQ_API_KEY=<server-side-secret>
GROQ_MODEL=qwen/qwen3.8-27b
SERPAPI_KEY=<server-side-secret>
GEMINI_API_KEY=<server-side-secret>
GEMINI_MODEL=gemini-2.0-flash
MARKETING_STUDIO_URL=https://<your-vercel-domain>/marketing-studio
STRATEGY_API_URL=https://<your-fastapi-render-domain>
```

Never expose these values as `NEXT_PUBLIC_*` variables or commit them. After
deployment, verify `https://<service>/health` and
`https://<service>/category-options?category=Fashion`.

## Endpoints

- `GET /` — Trend Finder dashboard.
- `GET /health` — service health.
- `POST /get_trends` — generate and score trend observations. Send
  `{"business":"women clothing store"}`.
- `GET /category-options?category=Fashion` — category-aware onboarding choices.
- `GET /integration/status` — non-secret integration status.
- `GET /marketing-studio` — redirect to the Next.js Marketing Studio.

## Environment

Create an ignored `.env` file with the provider credentials needed for live
signals:

```env
GROQ_API_KEY=
GROQ_MODEL=qwen/qwen3.8-27b
SERPAPI_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
MARKETING_STUDIO_URL=http://localhost:3000/marketing-studio
STRATEGY_API_URL=http://127.0.0.1:8000
```

Gemini is used only server-side for category-aware onboarding suggestions. The
browser receives suggestions, never the API key. If Gemini is unavailable, the
category-options endpoint returns generic fallback choices.

## Integration

The FastAPI backend calls `/get_trends` and stores each authenticated search.
The frontend calls the FastAPI adapter rather than calling Flask directly. Run
all three services for the complete workflow:

| Service | Port |
|---|---:|
| Flask Trend Finder | 5000 |
| FastAPI Strategy API | 8000 |
| Next.js frontend | 3000 |

## Validation

```powershell
python -m py_compile app.py
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5000/health
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:5000/category-options?category=Fashion"
```

The service returns live provider results only when the relevant credentials
are configured. It does not fabricate historical trend data.
