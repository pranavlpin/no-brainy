# T31 — Bulk entry rows get deterministic ids

**Module:** expenses · **Date:** 2026-10-17 · **Branch:** `feature/product-adoption-wave-2` · **Ledger:** [docs/tasks/expenses.md](../../tasks/expenses.md) · **Type:** bug fix

## Reproduction and root cause

Every load of `/expenses` logs "A tree hydrated but some attributes of the server rendered HTML didn't match the client". `ExpenseBulkEntry` creates its first row during render with `Math.random()` as the id, which is written to `data-row` attributes, so the server and client render different attributes.

## Predecessors

- Expenses predate the ledgers; no plan.

## Scope and affected files

- `src/components/expenses/expense-bulk-entry.tsx`: ids come from a per-instance counter (`row-1`, `row-2`, …) instead of `Math.random()`.
- Tests: `tests/component/expenses/bulk-entry-ids.test.tsx`.

## Fix approach

Minimal; ids are only React keys and `data-row` hooks.

## Test-id strategy and accessibility

`data-row` values become stable and predictable.

## Test plan

[docs/test-plans/expenses.md](../../test-plans/expenses.md) §T31.

## Owner ruling applied

The platform ledger's 2026-10-17 "End-to-end sweep defects" ruling (owner: "push the current changes and fix all in same branch.") pre-approves this plan on the integration branch. Found by the headless-Chrome sweep recorded in gitignored `evidences/e2e/full/REPORT.md`.
