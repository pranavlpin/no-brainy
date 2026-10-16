# NB-05 — Projects, planning metadata and dependable routines

Date: 2026-10-16 (Asia/Kolkata)
Status: APPROVED on 2026-10-16; implementation results are recorded in the task ledger.
Task branch: `feature/projects-outcomes-and-routines`
Target/base SHA: Record immediately before implementation; intended to stack on completed dependencies without merging to main.
Future approved task ledger: `/Users/pranav/Pranav_projects/github/no-brainy/docs/tasks/projects.md`
Section test plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/projects.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/projects.md>)
Package: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md>)

## Predecessors, KT and behavioral delta

No historical module task plan exists at baseline `01845cfa639f843dfb59f87558acc176338bb4c8`. Existing specifications are background history, not proof of completion. The following package plans are dependencies/predecessors; preserve their inherited records. This task changes only the behavior described below:

- NB-03: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/tasks/persistence-and-discovery.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/tasks/persistence-and-discovery.md>)
- NB-04: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/design/personal-workspace.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/design/personal-workspace.md>)

Extend the repaired task model from NB-03 and the shared UI from NB-04 with optional projects/context/planned dates/estimates. Complete stored recurrence behavior without recreating removed Habit tables. Historical goal and task data remain valid.

KT and source references:
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/MyFocusHub_PRD.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/MyFocusHub_PRD.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/TECHNICAL_SPEC.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/TECHNICAL_SPEC.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/prisma/schema.prisma](</Users/pranav/Pranav_projects/github/no-brainy/prisma/schema.prisma>)
- [/Users/pranav/Pranav_projects/github/no-brainy/prisma/migrations/20260421120000_remove_habits/migration.sql](</Users/pranav/Pranav_projects/github/no-brainy/prisma/migrations/20260421120000_remove_habits/migration.sql>)

## Scope and implementation sequence after approval

- Add Project with title, outcome, context, optional goal relation, status and next-action selection. Support create/edit/archive/detail, linked tasks and notes, and a clear next action.
- Add optional projectId, plannedDate, estimatedMinutes, effort and work/personal context to tasks with backward-compatible defaults. Keep dueDate independent. Task creation remains usable with title only.
- Expose existing goal linkage from task creation/editing and direct Add next action from projects; enforce owner checks on every relation.
- Implement daily/weekly/monthly recurrence with unique occurrence identity and transaction/idempotency protection. Keep completed occurrences as history. Completing/retrying an occurrence creates at most one next occurrence.
- Define month-end behavior as clamping to the next month valid day while preserving the original anchor. Support skip/pause/resume; missed days do not flood Today with a catch-up backlog.
- Keep pre-existing unsupported RRULE strings visible and editable with a clear unsupported state; do not silently reinterpret complex rules. Weekly practice targets can later count these occurrence records.
- Use additive migrations and test archive/delete relation policies so historical focus/evidence links remain meaningful.

## Affected files and module boundaries

Existing paths below are inspection/implementation targets; not-yet-existing paths are proposed additions. Keep helpers in feature-specific source locations and avoid unrelated restructuring.

- `/Users/pranav/Pranav_projects/github/no-brainy/prisma/schema.prisma`
- `/Users/pranav/Pranav_projects/github/no-brainy/prisma/migrations`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/types/tasks.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/validations/tasks.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/types/projects.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/validations/projects.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/tasks/recurrence.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/api/projects`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/api/tasks`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/hooks/use-projects.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components/projects`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components/tasks`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/projects`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/projects`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/projects`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/projects`

## Dependencies and data/state changes

New user-owned Project model. Add nullable planning/context/project fields on Task and recurrence identity fields with a unique template/date constraint. Add a safe plan-history event where reschedule counts are required; do not infer historic moves from updatedAt. Existing task/goal IDs stay unchanged.

Reuse the existing application stack and NB-02's explicitly approved test/development tools. No additional runtime library, external service, account change or cloud action is approved by this plan. Preserve authenticated-owner boundaries, current API envelopes and server/client separation. Schema migrations, where specified, are additive and validated against a populated disposable baseline.

## UI, automation and accessibility

Project cards and task rows use stable IDs. Forms progressively expose optional metadata. Keyboard-operable menus support completion, scheduling and archive. Project context filters do not duplicate records.

Use stable domain identifiers for React keys; use role/name/label locators first and stable data-testid values at meaningful boundaries where needed. No localized text/random value is used as a React key or test ID. New/reworked UI gets loading, empty, error and retry states. Honor user motion preferences. Screenshots are not required or automatically created.

## TDD acceptance cases

- **NB-05-T01 (unit):** Recurrence handles daily, weekly, month-end, leap-year, pause and skipped-day boundaries deterministically.
- **NB-05-T02 (integration):** Repeated/concurrent completion produces one next occurrence while preserving the completed record.
- **NB-05-T03 (integration):** Existing populated data survives migrations; missing new optional fields retain usable defaults.
- **NB-05-T04 (integration):** A project/task cannot reference another owner goal/project/parent.
- **NB-05-T05 (component):** A title-only task can be created, then linked to a project and goal without forcing extra fields.
- **NB-05-T06 (component):** Scheduling a task for Tuesday does not change its Friday deadline; project archive preserves historical records.

Before automated tests: obtain approval, create the named task branch, record base SHA, append this task's approved entry to the module ledger, and confirm the linked section test plan exists. Write the relevant tests and run them against the pre-change behavior. Record the expected behavioral red result before implementation; missing dependencies/database/browsers do not qualify as red. For acceptance tests of already-implemented behavior, record a genuine initial pass rather than manufacturing a failure; any required fix follows a failing regression and the approved scope.

Implement in small red/green/refactor slices. Targeted commands use the module directory under `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/component/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/` or `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/` according to the case type. NB-02 provides the executable scripts. Do not report a command as passing before it exists and runs.

## Risks, choices and external prerequisites

Recurrence and linking require transactions and unique constraints. Unsupported recurrence must fail visibly rather than create incorrect dates. Keep runtime packages unchanged and test migration compatibility on the disposable baseline.

The product choices in this plan are proposed rulings covered by approval of this named task. Unavailable infrastructure remains an explicit blocker to its associated gate; it never justifies silently dropping scope or replacing the stack. Any material expansion requires a successor plan/approval.

## Verification and completion record

Required: formatting of changed code/current docs, TypeScript, ESLint with zero warnings/errors, the full existing/new unit/component suite, affected database/browser suites, Prisma validation for schema changes, and the integrated production build. Never weaken tests/config to pass. Store actual red/green logs in `/Users/pranav/Pranav_projects/github/no-brainy/evidences/projects/outcomes-and-routines/` only after Git ignoring is verified.

Results: NOT RUN. Approval: Owner’s 2026-10-16 conversation message “approved.” covers this named plan and the dependencies explicitly listed in NB-02. Implementation: NOT STARTED. Update only this task's newly introduced ledger section with outcomes before landing. Push/PR/review/merge/deployment remain separate authorization gates.
