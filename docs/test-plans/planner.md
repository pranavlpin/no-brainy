# planner — test plan

## T06 — Morning triage and daily intent

- Scope: unit + component + integration.
- Unit: triage schema accepts keep/move/drop, requires `date` for move, rejects a `date` not after today.
- Integration: `POST /api/planner/triage` with mocked Prisma sets `dueDate` for keep, updates `dueDate` for move, sets `cancelled` for drop; `GET /api/planner/today` seeds `intentMd` from yesterday's review on first creation and does not overwrite an existing intent.
- Component: `TriageCard` renders `triage-row-${id}` per leftover and calls the handler with the chosen action; `IntentCard` renders the intent and `intent-make-task` creates a task.
