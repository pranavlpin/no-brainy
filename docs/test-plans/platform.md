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
