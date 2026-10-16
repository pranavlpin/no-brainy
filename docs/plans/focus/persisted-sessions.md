# T10 — Persisted focus sessions and mini timer

**Module:** focus · **Date:** 2026-10-16 · **Branch:** `feature/platform-daily-loop-overhaul` · **Ledger:** [docs/tasks/focus.md](../../tasks/focus.md)

## Summary

Pomodoro time is lost when focus mode closes, and the timer dies on navigation. This task records sessions, keeps the timer alive across routes with a top-bar pill, and surfaces deep-work minutes on Home and in the daily review.

## Predecessors

No plan exists for `src/components/focus/**`. Delta: timer state moves from component state to a persisted store; sessions are written to the database.

## Scope and affected files

- `prisma/schema.prisma`: `FocusSession { id, userId, taskId?, kind 'work'|'break', startedAt, endedAt?, durationSec, completed }`; migration `add_focus_sessions`
- `src/app/api/focus-sessions/route.ts` (new): `POST` start, `GET ?date=` list; `src/app/api/focus-sessions/[id]/route.ts`: `PATCH` end
- `src/stores/focus-store.ts` (new): timer state persisted to `localStorage` (`startedAt`, `kind`, `taskId`, `sessionId`, `pausedAt`); ticks derive from wall clock so navigation and reloads do not drift
- `src/components/focus/pomodoro-timer.tsx`: reads the store; completion writes `endedAt`
- `src/components/focus/focus-mode-view.tsx`: motion polish, ring progress
- `src/components/layout/focus-pill.tsx` (new): shows mm:ss and the task title in the top bar while a session runs outside focus mode; click returns to focus mode
- Home and review responses add `focusMinutesToday` / `focusMinutes`

## Dependencies

T02, T03.

## Data model / state changes

New table `focus_sessions` indexed on `(userId, startedAt)`.

## UI/UX

- Ring progress animates with a spring; the pill pulses softly on the last minute.
- Ending a work session plays the existing beep and shows a toast with the minutes logged.

## Test-id strategy and accessibility

`focus-timer`, `focus-start`, `focus-pause`, `focus-pill`. The pill is a button with `aria-live="polite"` text.

## Test plan

[docs/test-plans/focus.md](../../test-plans/focus.md) §T10.

## Risks and open questions

- Sessions left open on tab close. **Ruling applied:** on next load, an open session older than 2 h is closed at `startedAt + 25 min`.
