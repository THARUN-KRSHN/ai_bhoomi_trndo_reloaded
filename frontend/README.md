# TRNDO AI Marketing Studio frontend

This Next.js application provides the TRNDO AI Market Strategy interface and the downstream Marketing Studio. It is designed to work with the FastAPI backend in `..\market-strategy-model`.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Geist font
- Lucide icons

## Setup

```powershell
npm install
Copy-Item .env.local.example .env.local
```

The public environment contract is:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_ENABLE_DEMO_DATA=true
```

Only public, non-secret values belong in `.env.local`. Do not expose `OPENAI_API_KEY`, Telegram bot tokens, webhook secrets, UPI credentials, or database credentials to the browser.

## Development and production checks

```powershell
npm run dev
npx tsc --noEmit
npm run build
npm run lint
```

Open <http://localhost:3000> after starting the development server.

## Routes

### Market Strategy

- `/market-strategy`
- `/market-strategy/brief`
- `/market-strategy/generating`
- `/market-strategy/report/{reportId}`
- `/market-strategy/report/{reportId}/market-analysis`
- `/market-strategy/report/{reportId}/positioning`
- `/market-strategy/report/{reportId}/channels`
- `/market-strategy/report/{reportId}/execution`
- `/market-strategy/report/{reportId}/measurement`
- `/market-strategy/report/{reportId}/evidence`
- `/market-strategy/report/{reportId}/risks`

### Marketing Studio

- `/marketing-studio` — choose an approved strategy and start a promotion.
- `/marketing-studio/create?strategy={strategy_id}` — generate a poster and caption.
- `/marketing-studio/creations` — view saved creations.
- `/marketing-studio/creations/{promotion_id}` — inspect, copy, download, and revisit a creation.
- `/marketing-studio/inbox` — Telegram enquiry surface.
- `/marketing-studio/orders` — order status and payment-instruction surface.
- `/marketing-studio/orders/{order_id}` — order detail placeholder until list/detail backend support is expanded.

The strategy report includes a `Create Promotion` action that preserves the real strategy ID.

## Backend integration

The central API service is [src/lib/api/client.ts](./src/lib/api/client.ts). It provides typed helpers for:

- Strategy retrieval and generation.
- Promotion generation and retrieval.
- Telegram promotion delivery.
- Order lookup and status transitions.
- UPI payment instructions.

The current backend supports:

```text
POST /api/v1/promotions/generate
GET  /api/v1/promotions/{promotion_id}
POST /api/v1/promotions/{promotion_id}/telegram/send
GET  /api/v1/orders/{order_id}?merchant_id=...
POST /api/v1/orders/{order_id}/transition?merchant_id=...&status=...
POST /api/v1/orders/{order_id}/payment-instructions?merchant_id=...
GET  /api/v1/payments/qr/{order_id}?merchant_id=...
```

## Demo mode

With `NEXT_PUBLIC_ENABLE_DEMO_DATA=true`, the UI can use clearly labelled strategy, poster, inbox, and order fixtures. Demo promotion results are stored in browser local storage for the gallery experience. They do not send Telegram messages, settle payments, or mutate real backend orders.

With demo mode disabled:

- Backend failures are shown instead of being replaced by fictional success.
- Telegram and payment actions only run when explicitly requested.
- Inbox and order list surfaces explain when their corresponding backend list endpoints are unavailable.

The current backend does not yet expose a full strategy list, promotion list, Telegram conversation list, Telegram message-send endpoint, or order list. The UI deliberately reports those gaps rather than fabricating live records.

## Design and accessibility

The Marketing Studio uses the existing TRNDO visual language: editorial dark-green hero surfaces, mint accents, rounded cards, compact pills, responsive layouts, and focused creation controls. It supports desktop, tablet, and mobile layouts, preserves poster aspect ratios, includes visible focus styles, and uses honest loading, empty, error, and demo states.
