# T17 — Focus outcomes and session intention; review activity view

**Module:** focus · **Date:** 2026-10-16 · **Branch:** `feature/product-adoption-wave-2` · **Ledger:** [docs/tasks/focus.md](../../tasks/focus.md) · **Package:** [acceptance-branch-adoption.md](../product/acceptance-branch-adoption.md)

## Summary

A session ends with a result: Completed, Made progress, or Blocked, plus an optional note and next action. Only Completed finishes the linked task. Sessions with outcomes appear in the daily review and on Home, and can be cited as growth evidence later.

## Predecessors

- [persisted-sessions.md](./persisted-sessions.md) (T10). Delta: sessions gain intention and outcome fields; the timer no longer auto-starts a break at zero, it asks for the result first.
- [evening-close-the-day.md](../reviews/evening-close-the-day.md) (T07). Delta: the stats step lists the day's sessions.
- Ported, credited: the outcome model and finish dialog from `test/product-final-acceptance` (NB-08).

## Scope and affected files

- `prisma/schema.prisma`: `FocusSession.intention String @default("")`, `outcome String?`, `reflection String @default("") @db.Text`, `nextAction String?`, `nextActionTaskId String?`; migration `add_focus_outcomes`
- `src/app/api/focus-sessions/route.ts`, `[id]/route.ts`, `src/lib/focus/sessions.ts`, `src/lib/types/focus.ts`
- `src/components/focus/pomodoro-timer.tsx`, `focus-mode-view.tsx`, `src/components/focus/finish-dialog.tsx`
- `src/components/reviews/close-day-flow.tsx` (sessions list in the stats step), `src/app/api/reviews/daily/[date]/route.ts` (sessions in response)
- `src/components/home/focus-card.tsx` (pomodoros today)

## Data model / state changes

Additive columns on `focus_sessions`. Finishing is idempotent: a second PATCH with an outcome returns the stored result.

## UI/UX

Before starting, an optional intention line. At the end, or on Finish, a dialog with three outcome buttons, a result note, and a next action field. Completed marks the task done with the animated check; progress and blocked keep it open.

## Test-id strategy and accessibility

`focus-intention`, `focus-finish`, `focus-outcome-${value}`, `focus-result`. Dialog labelled.

## Test plan

[docs/test-plans/focus.md](../../test-plans/focus.md) §T17.

## Risks and open questions

- Next action text creates a task linked to the same goal and project as the session's task, undated. **Ruling applied.**

## Refinements (while the branch was open)

- `PATCH /api/focus-sessions/[id]` keeps its plain `completed` form for breaks and aborts; an `outcome` in the body switches to the transactional finish, and a session that already has an outcome returns the stored result without writing.
- The `completed` flag (a counted pomodoro) is set for every recorded outcome, including Blocked: the time was spent and the result is honest, so the block counts.
- At zero the timer pauses and opens the finish dialog; Skip during work also asks for the result; Reset abandons without one. Returning to focus mode with an unresolved block reopens the dialog.
- The next action task inherits the goal and context of the session's task and stays undated; the planner's triage will surface it when it gets a planned day.
- Home keeps the deep-work minutes line it already had; a pomodoro count on Home is deferred to T19's evidence view where sessions are cited.
