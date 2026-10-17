# T26 — Card creation endpoint and due-count consistency

**Module:** flashcards · **Date:** 2026-10-17 · **Branch:** `feature/product-adoption-wave-2` · **Ledger:** [docs/tasks/flashcards.md](../../tasks/flashcards.md) · **Type:** bug fix

## Reproduction and root cause

1. Deck page, Add Card, fill both sides, submit: nothing is created and the console shows a JSON parse error. `useCreateCard` posts to `/api/flashcards`, a route that does not exist; the server creates cards at `POST /api/decks/[id]/cards`. Reproduced on the owner's server with an empty POST (404).
2. Today and the sidebar badge say "2 cards due" while the deck page says 0 and hides "Start Review". The deck route computes "due" with `now.setHours(0,0,0,0)` (server-local midnight) while badges, home, review, and nudges use `dayBoundsUtc(todayKey(userTimezone(user))).start`.

## Predecessors

- Flashcards predate the ledgers (no plan). The badge and home due logic comes from [sidebar-groups-and-breadcrumbs](../nav/sidebar-groups-and-breadcrumbs.md) (T09) and the home plan (T05); delta: the deck route adopts the same day boundary.

## Scope and affected files

- `src/hooks/use-flashcards.ts`: `useCreateCard` posts to `/api/decks/${deckId}/cards` without `deckId` in the body.
- `src/app/api/decks/[id]/route.ts`: due count uses the user's day boundary.
- Tests: `tests/unit/flashcards/create-card-hook.test.tsx`, `tests/integration/flashcards/deck-route.test.ts`.

## Fix approach

Minimal. No API shape change; the deck response keeps `dueCount` and `newCount`.

## Test-id strategy and accessibility

No UI change.

## Test plan

[docs/test-plans/flashcards.md](../../test-plans/flashcards.md) §T26.

## Owner ruling applied

The platform ledger's 2026-10-17 "End-to-end sweep defects" ruling (owner: "push the current changes and fix all in same branch.") pre-approves this plan on the integration branch. Found by the headless-Chrome sweep recorded in gitignored `evidences/e2e/full/REPORT.md`.
