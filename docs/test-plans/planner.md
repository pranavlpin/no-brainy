# planner — test plan

## T06 — Morning triage and daily intent

- Scope: unit + component + integration.
- Unit: triage schema accepts keep/move/drop, requires `date` for move, rejects a `date` not after today.
- Integration: `POST /api/planner/triage` with mocked Prisma sets `dueDate` for keep, updates `dueDate` for move, sets `cancelled` for drop; `GET /api/planner/today` seeds `intentMd` from yesterday's review on first creation and does not overwrite an existing intent.
- Component: `TriageCard` renders `triage-row-${id}` per leftover and calls the handler with the chosen action; `IntentCard` renders the intent and `intent-make-task` creates a task.

## T15 — Capacity and time blocks

- Unit: `planCapacity` counts each task once (max of estimate and blocked time), keeps unknown estimates as unknown, adds buffer and unlinked blocks, detects overlaps, caps available minutes to the working window.
- Integration: today payload returns capacity fields and `plannedTasks`; `PUT` persists them; triage keep/move set `plannedDate` and leave `dueDate` unchanged.
- Component: `CapacityCard` shows over-capacity and unknown-estimate messages; `TimeBlockForm` rejects end before start and submits a block.

## T25 — Other-day defaults and capacity edits (bug fix)

- Scope: unit + component + integration (regression tests written first, failing).
- Integration: `GET /api/planner/2026-10-20` with no plan returns the user's personal `availableMinutes`/`bufferMinutes`/work window.
- Component: typing into the buffer field keeps the typed value when the card re-renders with a new server `availableMinutes`.
- Unit: two overlapping `useUpdatePlan` mutations invalidate the planner once, after the last one settles.
