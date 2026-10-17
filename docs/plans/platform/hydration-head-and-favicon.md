# T13 — Hydration failure from the root head, missing favicon, client-only state hydration

**Module:** platform · **Date:** 2026-10-16 · **Branch:** `feature/platform-daily-loop-overhaul` · **Ledger:** [docs/tasks/platform.md](../../tasks/platform.md) · **Type:** bug fix

## Reproduction and root cause

Reported by the owner during acceptance testing of the batch. Opening `/welcome` in the browser logs:

1. `In HTML, whitespace text nodes cannot be a child of <head>` followed by `Hydration failed because the server rendered text didn't match the client`.
2. `Cannot read properties of null (reading 'removeChild')` as React tears down the mismatched tree.
3. `favicon.ico 404`.

Root cause of 1 and 2: `src/app/layout.tsx` renders a manual `<head>` containing `{GA_ID && (...)}`. With `NEXT_PUBLIC_GA_ID=""` (the value `.env.example` ships and the local `.env` copied), the expression evaluates to the empty string, which React emits as a text node inside `<head>`. The server and client disagree about that node and hydration fails on every page. The bug predates this branch but was masked wherever the variable was unset rather than empty.

Root cause of 3: no `favicon.ico` exists and the metadata only lists SVG and PNG icons; browsers and the dev overlay still request `/favicon.ico`.

A related latent defect found while diagnosing: the UI store and the focus store read `localStorage` at module initialization, so a user with collapsed sidebar groups, hidden items, or a running timer would get a different first client render than the server HTML and hit the same hydration error after reload.

## Predecessors

- [motion-and-design-system-v2.md](./motion-and-design-system-v2.md) (shell), [sidebar-groups-and-breadcrumbs.md](../nav/sidebar-groups-and-breadcrumbs.md) (UI store groups), [persisted-sessions.md](../focus/persisted-sessions.md) (focus store). Delta: persisted client state now hydrates after mount instead of at import time. The root layout head bug has no plan; it predates the ledgers.

## Scope and affected files

- `src/components/analytics-scripts.tsx` (new): `GoogleAnalytics({ gaId })` renders the two `next/script` tags only for a non-empty id, otherwise `null`.
- `src/app/layout.tsx`: remove the manual `<head>`; render `GoogleAnalytics` inside `<body>`; add `shortcut: '/favicon.ico'` to metadata icons.
- `scripts/generate-icons.cjs`: also write `public/favicon.ico` (a 32 px PNG wrapped in an ICO container).
- `public/favicon.ico` (new, generated).
- `src/stores/ui-store.ts`, `src/stores/focus-store.ts`: initial state equals the server defaults; a `hydrate()` action loads persisted values; `AppShell` calls both on mount.
- Tests under `tests/unit/platform/` and `tests/component/platform/`.

## Fix approach

Minimal: eliminate the conditional text node, provide the file the browser asks for, and defer persisted-state reads to an effect. No behavior change for signed-in users beyond a one-frame delay before collapsed groups and a running timer appear.

## Test-id strategy and accessibility

No new UI. Existing test ids unchanged.

## Test plan

[docs/test-plans/platform.md](../../test-plans/platform.md) §T13.

## Owner ruling applied

The owner reported these errors while testing the batch they asked to be built without stopping. Defects found in the batch's own unlanded work are treated as pre-approved bug fixes on the same branch; recorded in the platform ledger on 2026-10-16.
