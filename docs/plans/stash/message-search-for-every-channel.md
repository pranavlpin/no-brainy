# T32 — Message search available on every channel

**Module:** stash · **Date:** 2026-10-17 · **Branch:** `feature/product-adoption-wave-2` · **Ledger:** [docs/tasks/stash.md](../../tasks/stash.md) · **Type:** bug fix

## Reproduction and root cause

Open a normal stash channel: the header offers Pin and Delete but no search. The search toggle in `StashChannelHeader` is wrapped in the same `channel.isSensitive &&` guard that is meant for the lock icon.

## Predecessors

- Stash predates the ledgers; no plan.

## Scope and affected files

- `src/components/features/stash/stash-channel-header.tsx`: render the search toggle and, once open, the search box for every channel (both carried the sensitive-only guard).
- Tests: `tests/component/stash/channel-header.test.tsx`.

## Fix approach

Remove the sensitive-only guard around the search button and the search box; the lock icon keeps it.

## Test-id strategy and accessibility

The toggle keeps `aria-label="Search messages"` / `"Close search"`.

## Test plan

[docs/test-plans/stash.md](../../test-plans/stash.md) §T32.

## Owner ruling applied

The platform ledger's 2026-10-17 "End-to-end sweep defects" ruling (owner: "push the current changes and fix all in same branch.") pre-approves this plan on the integration branch. Found by the headless-Chrome sweep recorded in gitignored `evidences/e2e/full/REPORT.md`.
