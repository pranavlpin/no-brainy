# tasks — task ledger

Append-only ledger for the `tasks` module. See `CLAUDE.md` §2 and §2a.

| ID | Task | Date | Branch | Plan | Status |
|---|---|---|---|---|---|
| T04 | Optimistic task mutations and completion motion | 2026-10-16 | feature/platform-daily-loop-overhaul | [plan](../plans/tasks/optimistic-mutations.md) | done — 16 files / 57 tests green; toggle, delete, pin, and focus updates are optimistic with rollback |
| T14 | Planned day, planning fields, pagination, active filter, draft-save on task detail and notes | 2026-10-16 | feature/product-adoption-wave-2 | [plan](../plans/tasks/planning-fields-and-draft-save.md) | done — 49 files / 157 tests green; migration add_task_planning_fields; 409 CONFLICT on tasks and notes; draft queue with SaveStatus; paginated Active list |
