# planner — task ledger

Append-only ledger for the `planner` module. See `CLAUDE.md` §2 and §2a.

| ID | Task | Date | Branch | Plan | Status |
|---|---|---|---|---|---|
| T06 | Morning triage and daily intent | 2026-10-16 | feature/platform-daily-loop-overhaul | [plan](../plans/planner/morning-triage-and-intent.md) | done — 20 files / 72 tests green; triage keep/move/drop and intent verified end to end on the dev server |
| T15 | Capacity and time blocks on Planner and Today | 2026-10-16 | feature/product-adoption-wave-2 | [plan](../plans/planner/capacity-and-time-blocks.md) | done — 52 files / 168 tests green; migration add_day_plan_capacity; triage sets plannedDate; capacity card, time blocks, planned vs deadline sections; Home load line |
| T25 | Bug fix: other days show personal capacity defaults; capacity edits survive saves | 2026-10-17 | feature/product-adoption-wave-2 | [plan](../plans/planner/other-day-defaults-and-capacity-edits.md) | fixed — root cause: the [date] placeholder hardcoded 180/15, number fields followed every server value, and the planner refetched after each of several overlapping saves. Placeholder uses personal defaults, focused fields keep their draft, refetch waits for the last pending save; 91 files / 254 tests green |
