# T04 — Optimistic task mutations and completion motion

**Module:** tasks · **Date:** 2026-10-16 · **Branch:** `feature/platform-daily-loop-overhaul` · **Ledger:** [docs/tasks/tasks.md](../../tasks/tasks.md)

## Summary

Every task interaction today waits for a server round trip and then refetches the whole task list, so checkboxes feel laggy and completed rows vanish abruptly. This task makes the hot paths optimistic with rollback and gives completion a deliberate animation.

## Predecessors

No plan exists for `src/hooks/use-tasks.ts` or `src/components/tasks/task-list.tsx`. Delta: mutations update the cache immediately and reconcile on settle; completed rows animate out.

## Scope and affected files

- `src/hooks/use-tasks.ts`: `useUpdateTask` gains `onMutate` that patches every cached `['tasks', *]` list and the `['tasks', id]` detail, `onError` rollback, `onSettled` targeted invalidation; `useCreateTask` inserts a temporary row; `useDeleteTask` removes optimistically
- `src/lib/query/optimistic.ts` (new): `patchListCaches(queryClient, keyPrefix, predicate, patch)` helper shared by tasks, notes (pin), and planner
- `src/hooks/use-planner.ts`: `useUpdatePlan` optimistic on `focusTaskIds`
- `src/hooks/use-notes.ts`: pin toggle optimistic via the shared helper
- `src/components/tasks/task-list.tsx`: rows become `motion.li` with `AnimatePresence`; completing a task pulses the check, holds 600 ms, then collapses height and fades before leaving the pending list; `data-testid="task-row-${id}"` and `task-toggle-${id}`
- `src/components/tasks/task-check.tsx` (new): animated checkbox (SVG path draw) used by task list, planner, and home

## Dependencies

`framer-motion` from T02.

## Data model / state changes

React Query cache shape unchanged. Temporary ids for optimistic creates use the `tmp-` prefix and are replaced on success.

## UI/UX

- Toggle feels instant; the row recolors immediately.
- Completed rows leave after 600 ms so the user sees the check, matching the "Show completed" filter semantics.
- Under reduced motion the hold is skipped and the row leaves immediately.

## Test-id strategy and accessibility

`task-row-${task.id}`, `task-toggle-${task.id}`; the toggle is a real `button role="checkbox" aria-checked`.

## Test plan

[docs/test-plans/tasks.md](../../test-plans/tasks.md) §T04.

## Risks and open questions

- Server-side recurring task logic may create a new task on completion; invalidating on settle keeps the list consistent. **Ruling applied:** keep `onSettled` invalidation.
