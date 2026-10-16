# T14 — Planned day, planning fields, pagination, active filter, draft-save

**Module:** tasks · **Date:** 2026-10-16 · **Branch:** `feature/product-adoption-wave-2` · **Ledger:** [docs/tasks/tasks.md](../../tasks/tasks.md) · **Package:** [acceptance-branch-adoption.md](../product/acceptance-branch-adoption.md) (approved "Go")

## Summary

Give tasks a planned day that is separate from the deadline, optional estimate / effort / context, correct list behavior (Active includes in-progress, numeric priority order, pagination controls), and reliable autosave with explicit save state and conflict handling on the task detail and note editors.

## Predecessors

- [optimistic-mutations.md](./optimistic-mutations.md) (T04): hooks and TaskList. Delta: `useTaskPage` exposes pagination metadata; `applyTaskUpdate` handles the new fields.
- [morning-triage-and-intent.md](../planner/morning-triage-and-intent.md) (T06): `dueDateSchema`. Delta: planning fields join the task schemas.
- Ported ideas and logic, credited: `src/lib/tasks/draft-save.ts`, `src/components/ui/save-status.tsx`, task planning fields, and the list fixes from `test/product-final-acceptance` (NB-03, NB-05).

## Defects fixed (reproduced first)

- Task detail autosave schedules one patch per field; a second edit within 800 ms replaces the first patch, so earlier changes are lost.
- The tasks list filters `status=pending`, which hides in-progress work; priority sorting is alphabetical on the string column; pagination metadata is discarded by the hook and there are no page controls.
- Note autosave has no retry, no conflict detection, and navigation cancels a pending save.

## Scope and affected files

- `prisma/schema.prisma`: `Task.plannedDate DateTime? @db.Date`, `estimatedMinutes Int?`, `effort String?`, `context String?`, `priorityRank Int @default(2)` (0 urgent … 3 low) with a backfill; migration `add_task_planning_fields`
- `src/lib/validations/tasks.ts`: new fields, `status: 'active'` in the query schema, `plannedDateFrom/To`, `dueDateFrom/To`, `sortBy: plannedDate`, `expectedUpdatedAt`
- `src/lib/types/tasks.ts`, `src/lib/tasks/format.ts`, `src/lib/tasks/priority.ts` (rank mapping)
- `src/app/api/tasks/route.ts`, `src/app/api/tasks/[id]/route.ts`: active filter, rank ordering, date filters, new fields, 409 `CONFLICT` when `expectedUpdatedAt` differs
- `src/app/api/notes/[id]/route.ts`: 409 `CONFLICT` on `expectedUpdatedAt`
- `src/lib/drafts/draft-save.ts` (ported), `src/hooks/use-draft-save.ts`, `src/components/ui/save-status.tsx`
- `src/hooks/use-tasks.ts`: `useTaskPage`
- `src/components/tasks/task-planning-fields.tsx`, `task-form.tsx` (collapsible Planning section)
- `src/app/(dashboard)/tasks/[id]/page.tsx`, `src/app/(dashboard)/notes/[id]/page.tsx`: draft-save with `SaveStatus`
- `src/app/(dashboard)/tasks/page.tsx`: Active default, include-completed toggle, pagination nav

## Data model / state changes

Additive columns on `tasks`; no data loss. `priorityRank` backfilled from `priority`. React Query key `['tasks', filters]` unchanged.

## UI/UX

Planning fields live in a collapsible section so title-only creation stays one line. `SaveStatus` reads Saved / Unsaved changes / Saving / Could not save (Retry) / Changed elsewhere (Keep mine / Use current). Pagination nav shows total and page.

## Test-id strategy and accessibility

`save-status`, `task-planning-fields`, `task-pages` nav with `aria-label="Task pages"`, `task-next-page`, `task-prev-page`. Labels on every planning field.

## Test plan

[docs/test-plans/tasks.md](../../test-plans/tasks.md) §T14.

## Risks and open questions

- Priority ordering via `priorityRank` requires every write path to set it; a Prisma middleware is avoided in favor of a small helper used by create and update. **Ruling applied.**
- Draft keys are scoped by user id and entity id so drafts never leak between accounts. **Ruling applied.**

## Refinements (while the branch was open)

- `withAuth` now forwards Next's route context as an optional third handler argument so route tests can call `PUT(req, { params })` with the real signature. Handlers that ignore it are unchanged.
- The planner routes (`/api/planner/[date]`, `/api/planner/carry-forward`) and the task routes all serialize through `src/lib/tasks/format.ts` so the new fields appear everywhere a task is returned.
- `SaveStatus` fades each state in but has no exit animation: the text must be current the moment the state changes, which an exit transition would delay.
- Priority sort uses `priorityRank` with the UI's "highest first" mapped to ascending rank; date sorts keep undated rows last in either direction.
- The matrix view requests one page of 100 so the quadrants see the whole active set; the list view pages by 20.
- The task title keeps a local echo so an emptied field never becomes an invalid save; it reverts on blur.
