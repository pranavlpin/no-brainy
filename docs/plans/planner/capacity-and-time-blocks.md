# T15 — Capacity and time blocks on Planner and Today

**Module:** planner · **Date:** 2026-10-16 · **Branch:** `feature/product-adoption-wave-2` · **Ledger:** [docs/tasks/planner.md](../../tasks/planner.md) · **Package:** [acceptance-branch-adoption.md](../product/acceptance-branch-adoption.md)

## Summary

Make the day realistic: editable available minutes, buffer, optional working window, a transparent planned-versus-available total that keeps unknown estimates unknown, and keyboard-first time blocks with overlap warnings. Triage decisions move the planned day, never the deadline.

## Predecessors

- [morning-triage-and-intent.md](./morning-triage-and-intent.md) (T06). Delta: keep/move set `plannedDate` instead of `dueDate`; the today payload adds `plannedTasks` and capacity fields; carry-forward covers tasks planned for earlier days as well as deadlines passed.
- [today-cockpit.md](../home/today-cockpit.md) (T05). Delta: Home focus card shows a one-line capacity summary.
- Ported, credited: `planCapacity` from `test/product-final-acceptance` (NB-07) and its time-block form behavior.

## Scope and affected files

- `prisma/schema.prisma`: `DayPlan.availableMinutes Int @default(180)`, `bufferMinutes Int @default(15)`, `workStart String?`, `workEnd String?`; migration `add_day_plan_capacity`
- `src/lib/planner/capacity.ts` (ported, with tests)
- `src/lib/planner/today.ts`, `src/app/api/planner/today/route.ts`, `[date]/route.ts`, `triage/route.ts`
- `src/lib/validations/planner.ts`, `src/lib/types/planner.ts`
- `src/components/planner/capacity-card.tsx`, `time-block-form.tsx`, `time-blocks.tsx`
- `src/components/planner/triage-card.tsx` copy ("Plan today" / "Choose a day"), `task-schedule.tsx` (planned vs deadline sections)
- `src/app/(dashboard)/planner/page.tsx`, `src/components/home/focus-card.tsx`

## Data model / state changes

Additive columns on `day_plans`. Capacity edits save through the plan update with optimistic cache.

## UI/UX

Capacity card with inputs, progress bar (amber when over), warnings for unknown estimates and overlaps, "Make a smaller day". Blocks animate in; the form validates end after start as a field error, overlap as a warning.

## Test-id strategy and accessibility

`capacity-control`, `capacity-summary`, `time-block-${id}`, `time-block-form`. Inputs labelled; warnings use `role="status"`.

## Test plan

[docs/test-plans/planner.md](../../test-plans/planner.md) §T15.

## Risks and open questions

- Existing tasks have no `plannedDate`; "due today" tasks still appear on Today under Deadlines so nothing disappears. **Ruling applied.**

## Refinements (while the branch was open)

- The today payload fetches the day's tasks in one query (planned for today OR due today) and splits them, so existing route tests that count `findMany` calls still hold.
- Leftovers for triage are open tasks planned for any earlier day plus deadlines passed yesterday; a task planned but never decided keeps asking until it is decided.
- "Make a smaller day" moves the lowest-priority estimated tasks to tomorrow, never the three focus tasks and never tasks without an estimate; the user sees a toast with the count.
- The capacity controls live behind an Adjust toggle so the card reads as a summary first.
- The progress bar's accessible name is "Day load" so it does not collide with the "Available minutes" field label.
- The new-block button reads "Add block"; the edit form reads "Save block".
- The matrix of planner routes (`today`, `[date]`) returns the capacity fields with defaults 180 / 15 so older plans need no backfill.
