# Focus task ledger

## NB-08 — Durable focus sessions

- Date: 2026-10-16 (Asia/Kolkata).
- Branch: `feature/focus-durable-sessions`.
- Target/base: `feature/planner-today-and-capacity`, `8a20b34d68c373965822b27365f9a3d98dffad68`.
- Approved plan: /Users/pranav/Pranav_projects/github/no-brainy/docs/plans/focus/durable-sessions.md.
- Approval: Owner's 2026-10-16 “approved.” covers this written plan and its existing dependencies.
- Status: IN PROGRESS — registered before tests/implementation.
- Decisions: One active running/paused session per owner. Timestamp-derived elapsed work is capped at the chosen duration; expiration awaits a deliberate result and never starts another work session. Server-version conflicts are explicit, with local owner-scoped pending commands retained for retry. Completed is the only result that completes a task; optional next actions remain distinct tasks.
- Verification: Pending red/green and integrated gates. Four inherited image warnings remain assigned to NB-12.
