# T25 — Other days show personal capacity defaults; capacity edits survive saves

**Module:** planner · **Date:** 2026-10-17 · **Branch:** `feature/product-adoption-wave-2` · **Ledger:** [docs/tasks/planner.md](../../tasks/planner.md) · **Type:** bug fix

## Reproduction and root cause

1. `GET /api/planner/<date>` for a day without a plan returns `availableMinutes: 180, bufferMinutes: 15` hardcoded (`src/app/api/planner/[date]/route.ts:59`), so tomorrow and next Monday show the old defaults while today honours personal setup (T21).
2. In the capacity card, committing "available" and then typing "buffer" lost the buffer value in two of three sweep runs. Each commit is its own PUT; `useUpdatePlan` invalidates the planner on every settle, so the refetch after the first PUT can land while the second is in flight and reset the number field, whose draft follows the server value unconditionally.

## Predecessors

- [capacity-and-time-blocks](./capacity-and-time-blocks.md) (T15) introduced the capacity card and the `[date]` placeholder; [backup-setup-quiet-hours](../platform/backup-setup-quiet-hours.md) (T21) introduced personal defaults. Delta: the date route uses `personalSettings`, number fields keep a focused draft, and the planner invalidates only after the last pending plan mutation settles.

## Scope and affected files

- `src/app/api/planner/[date]/route.ts`: placeholder capacity from `personalSettings(user.timezone, user.preferences)`.
- `src/components/planner/capacity-card.tsx`: `NumberField` syncs from the server only while not focused.
- `src/hooks/use-planner.ts`: `useUpdatePlan` gets a `mutationKey`; `onSettled` invalidates only when it is the last pending update.
- Tests: `tests/integration/planner/date-route.test.ts`, `tests/component/planner/capacity-field-focus.test.tsx`, `tests/unit/planner/update-plan-settle.test.tsx`.

## Fix approach

Minimal; no schema change. The plan is still created lazily by `getOrCreatePlan` on first visit to today.

## Test-id strategy and accessibility

Existing ids (`capacity-control`, `capacity-available`, `capacity-buffer`) unchanged.

## Test plan

[docs/test-plans/planner.md](../../test-plans/planner.md) §T25.

## Owner ruling applied

The platform ledger's 2026-10-17 "End-to-end sweep defects" ruling (owner: "push the current changes and fix all in same branch.") pre-approves this plan on the integration branch. Found by the headless-Chrome sweep recorded in gitignored `evidences/e2e/full/REPORT.md`.
