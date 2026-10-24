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

The current UI uses browser session authentication and interactive client routes.
`next.config.ts` keeps `cacheComponents` and `partialPrefetching` disabled so
Next.js does not drop those routes during instant-navigation validation. Do not
enable them until the client-authenticated layouts are migrated to that model.

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

### Account and discovery

- `/auth/register` — phone/PIN registration.
- `/auth/login` — session login with generic credential errors.
- `/onboarding` — three-step shop profile setup persisted by the backend.
- `/trends` — authenticated search against the existing Flask Trend Finder and strategy linking.
- `/onboarding` uses category-aware generated pills for products, audiences, brand personality, and channels; setup may be skipped and completed later.

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
- Authentication bootstrap, logout, profile persistence, Trend Finder search, and strategy-from-trend linking.

Protected workspace layouts validate `/api/v1/auth/me` before rendering and route
unfinished accounts to onboarding. The current bearer-token backend contract uses
browser session storage for the token; production should use an HTTP-only secure
cookie with CSRF protection.

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

The backend now exposes authenticated order listing and Telegram conversation-link
status. Full Telegram message history/send and strategy/promotion list APIs remain
future work; the UI does not fabricate those records.

## Design and accessibility

The Marketing Studio uses the existing TRNDO visual language: editorial dark-green hero surfaces, mint accents, rounded cards, compact pills, responsive layouts, and focused creation controls. It supports desktop, tablet, and mobile layouts, preserves poster aspect ratios, includes visible focus styles, and uses honest loading, empty, error, and demo states.
