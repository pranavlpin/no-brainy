# NB-03 — Task discovery, date contracts, and reliable saves

Date: 2026-10-16 (Asia/Kolkata)
Status: APPROVED on 2026-10-16; implementation results are recorded in the task ledger.
Task branch: `bugfix/tasks-persistence-and-discovery`
Target/base SHA: Record immediately before implementation; intended to stack on completed dependencies without merging to main.
Future approved task ledger: `/Users/pranav/Pranav_projects/github/no-brainy/docs/tasks/tasks.md`
Section test plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/tasks.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/tasks.md>)
Package: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md>)

## Predecessors, KT and behavioral delta

No historical module task plan exists at baseline `01845cfa639f843dfb59f87558acc176338bb4c8`. Existing specifications are background history, not proof of completion. The following package plans are dependencies/predecessors; preserve their inherited records. This task changes only the behavior described below:

- NB-02: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/platform/react-tdd-foundation.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/platform/react-tdd-foundation.md>)

Current active filtering drops in-progress work, pagination metadata is discarded, priority is sorted lexically, date contracts disagree, task partial-update debounce loses earlier fields, note navigation can cancel pending saves, and task mutations do not refresh the planner. Restore predictable existing behavior before adding features.

KT and source references:
- [/Users/pranav/Pranav_projects/github/no-brainy/README.md](</Users/pranav/Pranav_projects/github/no-brainy/README.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/TECHNICAL_SPEC.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/TECHNICAL_SPEC.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/STABILITY_SPRINTS.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/STABILITY_SPRINTS.md>)

## Scope and implementation sequence after approval

- Reproduce each issue with fixtures and executable regression tests; include more than 20 tasks with mixed statuses and priorities.
- Make Active include pending/in-progress. Preserve completion/cancelled controls, return/use pagination metadata, provide next-page access, and keep filtering/order stable. Handle null parent IDs correctly.
- Define one date-only task contract with compatibility for existing ISO inputs; validate real calendar dates and use saved user timezone for Today/overdue calculations. Include Asia/Kolkata midnight and a daylight-saving zone.
- Merge pending partial updates before debounced writes, serialize/reconcile saves, retain retryable drafts, and make unsaved/saving/saved/error states explicit. Navigation/refresh before a debounce must not silently discard changes.
- Invalidate or update every affected query family after task changes, including planner, goals and reviews where applicable; optimistic status feedback must rollback on failure.
- Honor both ends of task date filters, explicit priority ranking, existing subtasks and links. Normalize quick-capture date submission and avoid duplicate Enter submissions.

## Affected files and module boundaries

Existing paths below are inspection/implementation targets; not-yet-existing paths are proposed additions. Keep helpers in feature-specific source locations and avoid unrelated restructuring.

- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/tasks/page.tsx`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/tasks/[id]/page.tsx`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/notes/[id]/page.tsx`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/hooks/use-tasks.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/hooks/use-notes.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/hooks/use-planner.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/validations/tasks.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/types/tasks.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/api/tasks/route.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components/quick-capture/quick-capture-modal.tsx`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/tasks`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/dates`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/tasks`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/tasks`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/tasks`

## Dependencies and data/state changes

No new business model required. A versioned, user/entity-scoped draft record can protect local edits; remote data remains authoritative. Existing persisted deadlines and task statuses retain meaning.

Reuse the existing application stack and NB-02's explicitly approved test/development tools. No additional runtime library, external service, account change or cloud action is approved by this plan. Preserve authenticated-owner boundaries, current API envelopes and server/client separation. Schema migrations, where specified, are additive and validated against a populated disposable baseline.

## UI, automation and accessibility

Preserve task list scroll/filter state and keyboard focus. Use task IDs for repeated row keys and data-testid boundaries where needed; errors must remain visible and announced politely.

Use stable domain identifiers for React keys; use role/name/label locators first and stable data-testid values at meaningful boundaries where needed. No localized text/random value is used as a React key or test ID. New/reworked UI gets loading, empty, error and retry states. Honor user motion preferences. Screenshots are not required or automatically created.

## TDD acceptance cases

- **NB-03-T01 (unit):** Calendar normalization accepts valid date-only and compatible ISO inputs, rejects impossible dates, and computes Today correctly around India midnight.
- **NB-03-T02 (unit):** Autosave merges title and priority changes within 800 ms, preserves retry content, and handles responses arriving out of order.
- **NB-03-T03 (integration):** The active query returns pending and in-progress tasks over multiple pages with correct numeric priority order and bounded date filters.
- **NB-03-T04 (component):** Completing a task updates its planner representation immediately and rolls back on server failure.
- **NB-03-T05 (component):** Typing then navigating preserves the note draft; a reload/retry recovers the newest content without replacing a newer remote version.
- **NB-03-T06 (integration):** Task, parent and linked-goal ownership are enforced in affected mutation paths.

Before automated tests: obtain approval, create the named task branch, record base SHA, append this task's approved entry to the module ledger, and confirm the linked section test plan exists. Write the relevant tests and run them against the pre-change behavior. Record the expected behavioral red result before implementation; missing dependencies/database/browsers do not qualify as red. For acceptance tests of already-implemented behavior, record a genuine initial pass rather than manufacturing a failure; any required fix follows a failing regression and the approved scope.

Implement in small red/green/refactor slices. Targeted commands use the module directory under `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/component/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/` or `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/` according to the case type. NB-02 provides the executable scripts. Do not report a command as passing before it exists and runs.

## Risks, choices and external prerequisites

Date normalization and save coordination touch many consumers. Keep legacy values compatible, test current API envelopes, and avoid replacing persisted note/task IDs. Any conflict must be presented rather than resolved by silently overwriting newer text.

The product choices in this plan are proposed rulings covered by approval of this named task. Unavailable infrastructure remains an explicit blocker to its associated gate; it never justifies silently dropping scope or replacing the stack. Any material expansion requires a successor plan/approval.

## Verification and completion record

Required: formatting of changed code/current docs, TypeScript, ESLint with zero warnings/errors, the full existing/new unit/component suite, affected database/browser suites, Prisma validation for schema changes, and the integrated production build. Never weaken tests/config to pass. Store actual red/green logs in `/Users/pranav/Pranav_projects/github/no-brainy/evidences/tasks/persistence-and-discovery/` only after Git ignoring is verified.

Results: NOT RUN. Approval: Owner’s 2026-10-16 conversation message “approved.” covers this named plan and the dependencies explicitly listed in NB-02. Implementation: NOT STARTED. Update only this task's newly introduced ledger section with outcomes before landing. Push/PR/review/merge/deployment remain separate authorization gates.
