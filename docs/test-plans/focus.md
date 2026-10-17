# focus — test plan

## T10 — Persisted focus sessions and mini timer

- Scope: unit + component + integration.
- Unit: `focus-store` derives `remainingSec` from `startedAt` and wall clock; pause and resume preserve remaining time; `closeStaleSession` closes sessions older than 2 h at 25 min.
- Integration: `POST /api/focus-sessions` creates a work session; `PATCH` sets `endedAt` and `durationSec`; `GET ?date=` sums minutes for the user's local day.
- Component: `FocusPill` renders mm:ss and the task title while a session runs and is absent otherwise.

## T17 — Focus outcomes

- Integration: `PATCH /api/focus-sessions/[id]` with `outcome: completed` completes the linked task; `progress` and `blocked` leave it open; a `nextAction` creates an undated task linked to the same goal; a second finish returns the stored result.
- Component: `FinishDialog` offers three outcomes and passes the note and next action; the timer at zero opens the finish dialog instead of starting a break.
