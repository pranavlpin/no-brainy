# T27 — Book notes save as drafts without losing keystrokes

**Module:** books · **Date:** 2026-10-17 · **Branch:** `feature/product-adoption-wave-2` · **Ledger:** [docs/tasks/books.md](../../tasks/books.md) · **Type:** bug fix

## Reproduction and root cause

Open a book, type into Summary or "How I'll Apply This" at a normal pace: the saved text comes back garbled ("E2E Block 90 minutes…" became "EE lc9mnutes of deep work e ming"), and fast typing lost whole words. `save()` on the book page issues a PATCH on every keystroke; `useUpdateBook` invalidates the book query on each success, and the editor's "update value from outside" effect replaces the document with the stale server value while the user is still typing.

## Predecessors

- The book page predates the ledgers. The draft pattern follows [tasks planning and drafts](../tasks/planning-fields-and-draft-save.md) (T14); delta: text fields on the book page keep a local draft and save debounced.

## Scope and affected files

- `src/hooks/use-debounced-drafts.ts` (new, shared): per-field local drafts with a debounced save callback and a flush on unmount.
- `src/app/(dashboard)/books/[id]/page.tsx`: `summaryMd`, `learningsMd`, `applicationMd` go through the hook; editors render the draft, never the server echo, while a draft exists.
- Tests: `tests/unit/books/debounced-drafts.test.tsx`.

## Fix approach

Minimal and contained to the page. Structured editors (key ideas, quotes) keep their existing behaviour. The API is unchanged.

## Test-id strategy and accessibility

No UI change.

## Test plan

[docs/test-plans/books.md](../../test-plans/books.md) §T27.

## Owner ruling applied

The platform ledger's 2026-10-17 "End-to-end sweep defects" ruling (owner: "push the current changes and fix all in same branch.") pre-approves this plan on the integration branch. Found by the headless-Chrome sweep recorded in gitignored `evidences/e2e/full/REPORT.md`.
