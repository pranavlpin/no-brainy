# platform — test plan

Section-wise test plan for the `platform` module. Append new sections per task; never rewrite earlier ones.

## T01 — Governance, test layout, formatting gates

- Scope: unit. Relocated existing tests run green from `tests/unit/<module>/`; a smoke component test proves React Testing Library and jest-dom work under jsdom.
- Priority scenarios: `pnpm test` discovers only `tests/**`; `@/` alias resolves; `toBeInTheDocument` is available.
- Dependencies: `@testing-library/react`, `@testing-library/jest-dom`, `tests/setup.ts`.

## T02 — Motion system and design system v2

- Scope: unit + component.
- Unit: `use-toast` store supports multiple toasts, ids, max 3, dismiss by id; `show(message, type)` keeps the two-argument signature.
- Component: `Dialog` renders in a portal with `role="dialog"`, closes on Escape and backdrop click, calls `onConfirm`; `Toast` renders a `role="status"` region with `toast-${id}` items; `AnimatedNumber` renders the final value under reduced motion; `Card` applies the variant class; `MotionProvider` sets `reducedMotion="user"`.
- Dependencies: `framer-motion` (jsdom-safe), `matchMedia` mock in `tests/setup.ts`.

## T03 — User-timezone day boundaries

- Scope: unit + integration.
- Unit: `todayKey('Asia/Kolkata')` at 2026-10-16T23:00Z returns `2026-10-17`; `todayKey('UTC')` returns `2026-10-16`; `addDays`, `dayBoundsUtc`, `weekBounds` (Monday start), `isValidDateKey`, `userTimezone` fallback to `Asia/Kolkata` for `UTC`/empty.
- Integration: planner today route called with a user in `Asia/Kolkata` at 23:30Z creates the plan for the next local day (mocked Prisma); timezone PATCH rejects an invalid zone with 400.

## T13 — Head hydration failure, favicon, client-state hydration (bug fix)

- Scope: unit + component (regression tests written first, failing).
- Component: `GoogleAnalytics` renders no DOM for `""` or `undefined` and renders scripts for a real id.
- Unit: `src/app/layout.tsx` contains no manual `<head>` element; `public/favicon.ico` exists and starts with the ICO header bytes `00 00 01 00`; the UI store and focus store start from server defaults even when `localStorage` holds values, and `hydrate()` loads them.

## T21 — Backup, personal setup, quiet hours

- Unit: the export schema omits credentials and API keys and carries a version; `planImport` rejects unknown versions, oversized payloads, and dangling references, and remaps ids additively; quiet hours suppress nudges inside the window using the user's zone.
- Integration: `POST /api/data/import` without `confirm` writes nothing; a repeated `clientRequestId` returns the earlier receipt.

## T22 — Workspace states and context

- Component: `PageHeader`, `LoadingState`, `ErrorState`, `EmptyState` render their roles and actions; the top-bar context select stores the choice and the task list filters by it while keeping unclassified tasks.
