# T29 — Dark mode hydrates after mount; one app icon

**Module:** platform · **Date:** 2026-10-17 · **Branch:** `feature/product-adoption-wave-2` · **Ledger:** [docs/tasks/platform.md](../../tasks/platform.md) · **Type:** bug fix

## Reproduction and root cause

1. Turn dark mode on, reload: "Hydration failed because the server rendered HTML didn't match the client". `useDarkModeStore` reads `localStorage` and `matchMedia` while the module initialises, so the client's first render (Sun icon, `isDark: true`) differs from the server's (Moon icon). T13 fixed the same class of bug for the UI and focus stores.
2. Every page load logs `GET /icon.svg 500`: `public/icon.svg` (added by T11's icon generation, and asserted by T11's manifest test) conflicts with the metadata route `src/app/icon.svg`; Next refuses to serve a path that is both.

## Predecessors

- [hydration-head-and-favicon](./hydration-head-and-favicon.md) (T13): delta extends after-mount hydration to the dark-mode store. [bottom-nav-and-pwa](../mobile/bottom-nav-and-pwa.md) (T11): delta removes the duplicate metadata route; the public file T11 generates from stays, and the root metadata already lists `/icon.svg` explicitly.

## Scope and affected files

- `src/stores/dark-mode-store.ts`: server-safe initial state, `hydrate()` loads the preference, applies the class, and subscribes to system changes.
- `src/components/theme-initializer.tsx`: calls `hydrate()` on mount.
- `src/app/layout.tsx`: a tiny inline script at the top of `<body>` applies the saved `dark` class before paint so there is no flash.
- `src/app/icon.svg` removed; `public/icon.svg` and `scripts/generate-icons.cjs` unchanged.
- Tests: `tests/unit/platform/dark-mode-store.test.ts`, `tests/unit/platform/app-icon.test.ts`.

## Fix approach

Same approach as T13: initial state equals the server defaults, persisted state loads in an effect.

## Test-id strategy and accessibility

No UI change.

## Test plan

[docs/test-plans/platform.md](../../test-plans/platform.md) §T29.

## Owner ruling applied

The platform ledger's 2026-10-17 "End-to-end sweep defects" ruling (owner: "push the current changes and fix all in same branch.") pre-approves this plan on the integration branch. Found by the headless-Chrome sweep recorded in gitignored `evidences/e2e/full/REPORT.md`.
