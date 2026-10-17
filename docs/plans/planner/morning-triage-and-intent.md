# T06 — Morning triage and daily intent

**Module:** planner · **Date:** 2026-10-16 · **Branch:** `feature/platform-daily-loop-overhaul` · **Ledger:** [docs/tasks/planner.md](../../tasks/planner.md)

## Summary

The planner's carry-forward banner only offers "add to focus". A morning ritual needs a decision per leftover task: keep it today, move it to a date, or drop it. The plan also gains an intent line seeded from last night's review so the day starts with yesterday's promise in view.

## Predecessors

No plan exists for the planner (routes under `src/app/api/planner/` and `src/app/(dashboard)/planner/page.tsx`, components in `src/components/planner/`). Delta: triage actions replace add-only; `DayPlan` gains `intentMd`; day boundaries use T03 helpers.

## Scope and affected files

- `prisma/schema.prisma`: `DayPlan.intentMd String? @db.Text`; migration `add_day_plan_intent`
- `src/app/api/planner/triage/route.ts` (new): `POST { taskId, action: 'keep' | 'move' | 'drop', date? }`. keep → `dueDate = today`; move → `dueDate = date` (must be after today); drop → `status = 'cancelled'`. Returns updated task.
- `src/app/api/planner/today/route.ts`: on first creation of today's plan, copy `tomorrowIntent` from yesterday's `DailyReview` into `intentMd`; response adds `intentMd`, `carryForward` list (so the client no longer POSTs carry-forward on every mount), `goalsById` map for chips
- `src/app/api/planner/carry-forward/route.ts`: kept for compatibility; stops being called on mount
- `src/lib/validations/planner.ts`, `src/lib/types/planner.ts`: `intentMd`, triage schema
- `src/hooks/use-planner.ts`: `useTriageTask` optimistic; `useTodayPlan` returns the enriched shape
- `src/components/planner/triage-card.tsx` (new): per-task row with Keep / Move (popover with Tomorrow, Next Monday, pick date) / Drop; rows animate out on decision
- `src/components/planner/intent-card.tsx` (new): shows intent, "Make it a task" creates a task from the text and adds it to focus slot 1
- `src/components/planner/focus-tasks.tsx`: picker groups by goal with chips; empty slots animate
- `src/app/(dashboard)/planner/page.tsx`: layout reorganized as Intent → Triage (if any) → Focus → Due today → AI suggest

## Dependencies

T02 (motion, dialog), T03 (dates), T04 (optimistic helper).

## Data model / state changes

`day_plans.intent_md` nullable text. Query key `['planner', 'today']` shape gains `intentMd`, `carryForward`, `goals`.

## UI/UX

- Triage card appears only when leftovers exist; each decision animates the row out and updates counts.
- Move popover offers Tomorrow, Next Monday, and a date input.
- Intent card uses a quote style with the previous evening's date.

## Test-id strategy and accessibility

`triage-row-${taskId}`, `triage-keep-${taskId}`, `triage-move-${taskId}`, `triage-drop-${taskId}`, `intent-card`, `intent-make-task`, `focus-slot-${index}`. Buttons carry `aria-label`s that include the task title.

## Test plan

[docs/test-plans/planner.md](../../test-plans/planner.md) §T06.

## Risks and open questions

- Dropping sets `cancelled` rather than deleting, so nothing is lost. **Ruling applied.**
- Recurring tasks: triage acts on the current instance only. **Ruling applied.**

## Refinements while on the task branch (2026-10-16)

- Seeding `intentMd` from the previous evening's review needs the `tomorrowIntent` column that T07 introduces, so the seeding logic lands with T07. T06 adds the column, exposes and accepts `intentMd` on the today plan, and lets the intent be edited inline so it is usable immediately.
- `createTaskSchema` / `updateTaskSchema` currently require a full ISO datetime for `dueDate`, which rejects the `YYYY-MM-DD` values the triage actions and the date inputs send. T06 widens both to accept a date key (normalized to UTC midnight) or an ISO datetime.
- The today route now returns `carryForward` (yesterday's leftovers) and `goals` (id, title, category for chips), so the planner no longer POSTs carry-forward on every mount.
