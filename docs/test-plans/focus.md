# focus — test plan

## T10 — Persisted focus sessions and mini timer

- Scope: unit + component + integration.
- Unit: `focus-store` derives `remainingSec` from `startedAt` and wall clock; pause and resume preserve remaining time; `closeStaleSession` closes sessions older than 2 h at 25 min.
- Integration: `POST /api/focus-sessions` creates a work session; `PATCH` sets `endedAt` and `durationSec`; `GET ?date=` sums minutes for the user's local day.
- Component: `FocusPill` renders mm:ss and the task title while a session runs and is absent otherwise.
