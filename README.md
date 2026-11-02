# Withdraw Page

🇬🇧 **English** | [🇷🇺 Русский](README.ru.md)

[![CI](https://github.com/ramach05/withdraw-page/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ramach05/withdraw-page/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-13%20Vitest%20%2B%201%20Playwright-brightgreen)](#testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A money-withdrawal form built around its failure modes: every `POST` carries a
UUID `Idempotency-Key`, network errors and 5xx retry up to 3 times without
losing the entered data, `409` surfaces the server message, an in-flight
request is aborted on unmount, and a double click never sends twice.

## Screens

| Landing (desktop) | Withdrawal form (desktop) |
| --- | --- |
| <img src="screenshots/main-page-desktop.png" alt="Landing page" width="320" /> | <img src="screenshots/withdraw-page-desktop.png" alt="Withdrawal form" width="320" /> |

| Request created (mobile) | Failed request (mobile) |
| --- | --- |
| <img src="screenshots/correct-request-mobile.png" alt="Created withdrawal card" width="240" /> | <img src="screenshots/error-request-mobile.png" alt="Error message, form data preserved" width="240" /> |

## Highlights

- **Idempotent submit** — one UUID `Idempotency-Key` per logical submission;
  a duplicate gets `409` and the server message is shown to the user.
- **Retry policy** — up to 3 attempts with a 1 s delay on network errors and
  5xx; no retry on other 4xx; form values survive every attempt.
- **Cancellation** — `AbortController` cancels the request on unmount;
  `AbortError` never touches the store.
- **Double-submit guard** — disabled button plus a `status === 'loading'`
  check in the handler.
- **No tokens in localStorage** — the `Authorization` header comes from a
  dev-only mock; httpOnly cookies or a BFF are documented as the production
  approach.
- **Restore after reload** — the last successful withdrawal is re-shown for
  5 minutes (localStorage, TTL-checked and shape-checked parsing).

## States and error handling

UI states: `idle` → `loading` → `success` / `error`.

| Response | Behavior |
| --- | --- |
| `200` | withdrawal saved to the store; success card with id, amount, recipient, status |
| `409` | server `message` rendered, no retry |
| other `4xx` | error rendered, no retry, form stays filled |
| `5xx` / network error | up to 3 attempts with a 1 s delay, then error; form stays filled |

## Features

- Fields: amount (> 0), recipient (required), confirmation checkbox.
- Live validation; submit is enabled only for a valid form.
- Submit button and fields disable while a request is in flight.
- Semantic markup: `form`, `fieldset`, `label`; `role="status"` for success,
  `role="alert"` for errors; text-only rendering, no `dangerouslySetInnerHTML`.
- Rendering cost kept down: `React.memo`, `useMemo` / `useCallback`,
  Zustand selectors with `useShallow`.

## API

- `POST /api/v1/withdrawals` — headers `Content-Type: application/json`,
  `Idempotency-Key: <uuid>`; body `{ "amount": number, "destination": string }`.
  `200` returns the withdrawal object (`id`, `amount`, `destination`,
  `status`, `createdAt`); `409` returns `{ "message": string }`.
- `GET /api/v1/withdrawals/{id}` — available for follow-up loads; the app
  renders the data it got from `POST`.

Dev runs against Next.js API Route mocks in
[src/app/api/v1/withdrawals/](src/app/api/v1/withdrawals/). Set
`NEXT_PUBLIC_API_BASE` to point the client at a real backend.

## Structure

```
├── src/
│   ├── app/                    # routes + API mock (App Router)
│   ├── api/                    # API_BASE, auth headers, withdrawalsApi with retry
│   ├── store/                  # Zustand: form, status, lastWithdrawal, error
│   ├── components/             # WithdrawForm
│   ├── hooks/                  # useWithdrawSubmit
│   ├── types/                  # withdrawal types
│   └── utils/                  # idempotency key, validation, localStorage TTL
└── __tests__/
    ├── unit/                   # Vitest + Testing Library
    └── e2e/                    # Playwright
```

## Testing

13 unit tests (Vitest + Testing Library): happy path with the idempotency
header asserted, `500` → 3 retries → error with data preserved, two clicks →
one `POST`, empty-form and non-positive-amount validation, `409` message
rendering, loading state, restore from localStorage, storage TTL and
malformed-JSON handling.

1 E2E test (Playwright, Chromium): fill the form, submit, assert the success
card. Run with `npm run test:e2e`; first run needs
`npx playwright install chromium`.

## Quick start

Node.js 20+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000/](http://localhost:3000/).

| Script | Description |
| --- | --- |
| `npm run dev` | dev server |
| `npm run build` | production build |
| `npm run start` | serve the build |
| `npm run lint` | ESLint |
| `npm test` | unit tests (Vitest) |
| `npm run test:e2e` | E2E tests (Playwright) |
| `npm run test:watch` | Vitest in watch mode |

## Stack

**React 19** · **Next.js 16** (App Router) · **TypeScript 5** · **Zustand 5**

## License

MIT
