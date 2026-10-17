# T33 — Rating a card in a review session is rejected

**Module:** flashcards · **Date:** 2026-10-17 · **Branch:** `feature/product-adoption-wave-2` · **Ledger:** [docs/tasks/flashcards.md](../../tasks/flashcards.md) · **Type:** bug fix

## Reproduction and root cause

Start a review, reveal a card, rate it: `POST /api/flashcards/<id>/rate` answers 400 and the rating is lost, so the card comes straight back in the next session and the deck never progresses. The route requires `sessionId` (`rateCardSchema`), but the review page sends only `{ cardId, rating }` even though it holds the session returned by the start call. Found while verifying T26 in the browser: once cards could be created, the first review exposed it.

## Predecessors

- [card-creation-and-due-count](./card-creation-and-due-count.md) (T26) made cards creatable; delta: ratings now carry the session id. The review page itself predates the ledgers.

## Scope and affected files

- `src/lib/types/flashcards.ts`: `ReviewFlashcardRequest` gains `sessionId`.
- `src/app/(dashboard)/flashcards/[id]/review/page.tsx`: pass the current session id with every rating.
- Tests: `tests/component/flashcards/review-session.test.tsx`.

## Fix approach

Minimal; the API is unchanged.

## Test-id strategy and accessibility

No UI change.

## Test plan

[docs/test-plans/flashcards.md](../../test-plans/flashcards.md) §T33.

## Owner ruling applied

The owner's instruction "push the current changes and fix all in same branch." (platform ledger ruling of 2026-10-17) covers the sweep's defects; this one surfaced while verifying one of them in the same module and user flow and is treated as part of that batch.
