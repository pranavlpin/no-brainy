# T30 — Notification list item nests a button inside a button

**Module:** notifications · **Date:** 2026-10-17 · **Branch:** `feature/product-adoption-wave-2` · **Ledger:** [docs/tasks/notifications.md](../../tasks/notifications.md) · **Type:** bug fix

## Reproduction and root cause

Open `/notifications` with an unread item: React logs "`<button>` cannot be a descendant of `<button>`" and a hydration error. Each list row is a `<button>` that contains the "Mark read" `<Button>`.

## Predecessors

- The notifications page predates the ledgers; [cron-nudges](./cron-nudges.md) (T12) left the page markup untouched. Delta: the row becomes a flex container with the row action and the "Mark read" action as sibling buttons.

## Scope and affected files

- `src/app/(dashboard)/notifications/page.tsx`: restructure the row.
- Tests: `tests/component/notifications/notifications-page.test.tsx`.

## Fix approach

Minimal markup change, same behaviour: clicking the row marks it read and navigates; "Mark read" only marks it read.

## Test-id strategy and accessibility

Row gets `data-testid="notification-row-${id}"`, the secondary action `notification-mark-read-${id}`. Both remain real buttons.

## Test plan

[docs/test-plans/notifications.md](../../test-plans/notifications.md) §T30.

## Owner ruling applied

The platform ledger's 2026-10-17 "End-to-end sweep defects" ruling (owner: "push the current changes and fix all in same branch.") pre-approves this plan on the integration branch. Found by the headless-Chrome sweep recorded in gitignored `evidences/e2e/full/REPORT.md`.
