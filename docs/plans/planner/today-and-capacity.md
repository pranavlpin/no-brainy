# NB-07 — Today, deliberate planning and editable time blocks

Date: 2026-10-16 (Asia/Kolkata)
Status: APPROVED on 2026-10-16; implementation results are recorded in the task ledger.
Task branch: `feature/planner-today-and-capacity`
Target/base SHA: Record immediately before implementation; intended to stack on completed dependencies without merging to main.
Future approved task ledger: `/Users/pranav/Pranav_projects/github/no-brainy/docs/tasks/planner.md`
Section test plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/planner.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/planner.md>)
Package: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md>)

## Predecessors, KT and behavioral delta

No historical module task plan exists at baseline `01845cfa639f843dfb59f87558acc176338bb4c8`. Existing specifications are background history, not proof of completion. The following package plans are dependencies/predecessors; preserve their inherited records. This task changes only the behavior described below:

- NB-05: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/projects/outcomes-and-routines.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/projects/outcomes-and-routines.md>)
- NB-06: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/inbox/capture-and-process.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/inbox/capture-and-process.md>)

Complete the current planner using NB-05 planning metadata and NB-06 capture. Replace the due-date-restricted picker with all-active-task selection; preserve legacy planner access. Add an intentional day plan and capacity, not a new copy of tasks.

KT and source references:
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/MyFocusHub_PRD.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/MyFocusHub_PRD.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/TECHNICAL_SPEC.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/TECHNICAL_SPEC.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE2_SPEC.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE2_SPEC.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/src/lib/validations/planner.ts](</Users/pranav/Pranav_projects/github/no-brainy/src/lib/validations/planner.ts>)

## Scope and implementation sequence after approval

- Build Today with one main outcome, up to two supporting priorities, direct Start Focus, a short schedule, a growth action, and an end-day entry point.
- Allow choosing any active task with search/pagination, including undated tasks, and creating a next action without leaving Today. Preserve the maximum three focus tasks across UI/API/AI.
- Add editable available minutes/working window and optional break/buffer time. Compute planned versus available minutes transparently; unknown estimates remain unknown, not zero-effort tasks.
- Create/edit/move/delete time blocks with task links, validated start/end values, overlap warnings and keyboard alternatives to drag interactions. Persist order and date.
- Review unfinished work from all relevant previous dates. Offer continue/reschedule/split/drop explicitly; do not change deadlines when changing planned days.
- Make authenticated default entry Today, preserve original deep links and show useful empty/loading/error/retry states. No charts or overdue counts should dominate the opening task.
- Expose a normal day and a smaller-capacity day through adjustable capacity/optional commitments; never automatically discard commitments based on inferred mood.

## Affected files and module boundaries

Existing paths below are inspection/implementation targets; not-yet-existing paths are proposed additions. Keep helpers in feature-specific source locations and avoid unrelated restructuring.

- `/Users/pranav/Pranav_projects/github/no-brainy/prisma/schema.prisma`
- `/Users/pranav/Pranav_projects/github/no-brainy/prisma/migrations`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/today/page.tsx`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/planner/page.tsx`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components/planner`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/api/planner`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/hooks/use-planner.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/types/planner.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/validations/planner.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components/auth`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/middleware.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/planner`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/planner`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/planner`

## Dependencies and data/state changes

Extend DayPlan with mainOutcome, availableMinutes and optional growthTaskId; keep existing focusTaskIds/timeBlocks compatible. Store date-only day identity in user timezone. Reuse Task plannedDate and reschedule history from NB-05; validate all linked task ownership.

Reuse the existing application stack and NB-02's explicitly approved test/development tools. No additional runtime library, external service, account change or cloud action is approved by this plan. Preserve authenticated-owner boundaries, current API envelopes and server/client separation. Schema migrations, where specified, are additive and validated against a populated disposable baseline.

## UI, automation and accessibility

Stable boundaries include today-outcome, today-start-focus, focus-task-{id}, time-block-{id}, capacity-control and carry-forward-{id}. Scheduling controls support keyboard and touch. Progress includes partial work without pretending a task is completed.

Use stable domain identifiers for React keys; use role/name/label locators first and stable data-testid values at meaningful boundaries where needed. No localized text/random value is used as a React key or test ID. New/reworked UI gets loading, empty, error and retry states. Honor user motion preferences. Screenshots are not required or automatically created.

## TDD acceptance cases

- **NB-07-T01 (unit):** Capacity accounts for estimated time, buffers and unknown estimates without claiming an impossible fit.
- **NB-07-T02 (integration):** An undated active task can be selected; cancelled/completed/foreign tasks and more than three focus IDs are rejected.
- **NB-07-T03 (integration):** Saved time blocks validate ordering/dates/ownership and survive reload without changing task deadlines.
- **NB-07-T04 (component):** Complete/undo/reschedule reflects immediately across Today and Tasks, including error rollback.
- **NB-07-T05 (component):** All focus candidates remain reachable beyond page one and earlier missed days remain discoverable.
- **NB-07-T06 (e2e):** A signed-in user lands on Today, selects an undated growth action and starts Focus directly.

Before automated tests: obtain approval, create the named task branch, record base SHA, append this task's approved entry to the module ledger, and confirm the linked section test plan exists. Write the relevant tests and run them against the pre-change behavior. Record the expected behavioral red result before implementation; missing dependencies/database/browsers do not qualify as red. For acceptance tests of already-implemented behavior, record a genuine initial pass rather than manufacturing a failure; any required fix follows a failing regression and the approved scope.

Implement in small red/green/refactor slices. Targeted commands use the module directory under `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/component/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/` or `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/` according to the case type. NB-02 provides the executable scripts. Do not report a command as passing before it exists and runs.

## Risks, choices and external prerequisites

The current duplicate root-route arrangement needs a build check during NB-04/this task. Do not introduce client/server date disagreement. Warning about overlap is distinct from rejecting an invalid interval. Keep any AI choice optional.

The product choices in this plan are proposed rulings covered by approval of this named task. Unavailable infrastructure remains an explicit blocker to its associated gate; it never justifies silently dropping scope or replacing the stack. Any material expansion requires a successor plan/approval.

## Verification and completion record

Required: formatting of changed code/current docs, TypeScript, ESLint with zero warnings/errors, the full existing/new unit/component suite, affected database/browser suites, Prisma validation for schema changes, and the integrated production build. Never weaken tests/config to pass. Store actual red/green logs in `/Users/pranav/Pranav_projects/github/no-brainy/evidences/planner/today-and-capacity/` only after Git ignoring is verified.

Results: NOT RUN. Approval: Owner’s 2026-10-16 conversation message “approved.” covers this named plan and the dependencies explicitly listed in NB-02. Implementation: NOT STARTED. Update only this task's newly introduced ledger section with outcomes before landing. Push/PR/review/merge/deployment remain separate authorization gates.
