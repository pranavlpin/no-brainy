# NB-08 — Durable focus sessions, interruptions and results

Date: 2026-10-16 (Asia/Kolkata)
Status: APPROVED on 2026-10-16; implementation results are recorded in the task ledger.
Task branch: `feature/focus-durable-sessions`
Target/base SHA: Record immediately before implementation; intended to stack on completed dependencies without merging to main.
Future approved task ledger: `/Users/pranav/Pranav_projects/github/no-brainy/docs/tasks/focus.md`
Section test plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/focus.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/focus.md>)
Package: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md>)

## Predecessors, KT and behavioral delta

No historical module task plan exists at baseline `01845cfa639f843dfb59f87558acc176338bb4c8`. Existing specifications are background history, not proof of completion. The following package plans are dependencies/predecessors; preserve their inherited records. This task changes only the behavior described below:

- NB-07: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/planner/today-and-capacity.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/planner/today-and-capacity.md>)

The phase-3 specification deliberately made focus component-local and nonpersistent. Replace that behavior with durable timestamp-based sessions while keeping NB-07 direct entry and NB-06 capture available.

KT and source references:
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE3_SPEC.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE3_SPEC.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/src/components/focus/pomodoro-timer.tsx](</Users/pranav/Pranav_projects/github/no-brainy/src/components/focus/pomodoro-timer.tsx>)
- [/Users/pranav/Pranav_projects/github/no-brainy/src/components/layout/app-shell.tsx](</Users/pranav/Pranav_projects/github/no-brainy/src/components/layout/app-shell.tsx>)

## Scope and implementation sequence after approval

- Offer 25/50/custom duration, optional session intention, pause/resume and optional break reminders/sound. Do not automatically start a new work session without a choice.
- Store start/resume instants and elapsed active time; derive the display from time rather than counting interval callbacks. Recover across tab suspension, refresh and closing full-screen Focus.
- Persist server session identity and a scoped local recovery checkpoint. Resolve multiple tabs/devices against the current server session; avoid concurrent duplicate active timers.
- Keep a compact timer outside full-screen mode. Let the user read linked notes, check subtasks and capture a distraction without ending the session.
- End with Completed, Made progress or Blocked plus an optional result/next action. Saving the result is idempotent; only Completed deliberately changes task status.
- Retain aggregate focus duration and outcome for Today, growth evidence and review without treating time spent as a quality score.

## Affected files and module boundaries

Existing paths below are inspection/implementation targets; not-yet-existing paths are proposed additions. Keep helpers in feature-specific source locations and avoid unrelated restructuring.

- `/Users/pranav/Pranav_projects/github/no-brainy/prisma/schema.prisma`
- `/Users/pranav/Pranav_projects/github/no-brainy/prisma/migrations`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/focus`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/types/focus.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/validations/focus.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/api/focus`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/hooks/use-focus.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/stores/ui-store.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components/focus`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components/layout/app-shell.tsx`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/focus`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/focus`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/focus`

## Dependencies and data/state changes

New user-owned FocusSession with taskId, state, startedAt, activeSince, accumulatedSeconds, plannedSeconds, completedAt, outcome, optional reflection and version/request identity. Use a unique active-session constraint or transaction-safe per-owner coordination. Task removal retains a readable session title snapshot.

Reuse the existing application stack and NB-02's explicitly approved test/development tools. No additional runtime library, external service, account change or cloud action is approved by this plan. Preserve authenticated-owner boundaries, current API envelopes and server/client separation. Schema migrations, where specified, are additive and validated against a populated disposable baseline.

## UI, automation and accessibility

Timer controls use visible labels and keyboard shortcuts only outside text editors. Important session state is announced without announcing every second. Key lookup boundaries are focus-session-{id}, focus-pause, focus-finish, focus-result and compact-focus-timer.

Use stable domain identifiers for React keys; use role/name/label locators first and stable data-testid values at meaningful boundaries where needed. No localized text/random value is used as a React key or test ID. New/reworked UI gets loading, empty, error and retry states. Honor user motion preferences. Screenshots are not required or automatically created.

## TDD acceptance cases

- **NB-08-T01 (unit):** Fake-clock tests cover work/pause/resume/finish, tab suspension and elapsed-time derivation.
- **NB-08-T02 (unit):** Refresh recovery does not count paused time or reset elapsed work; custom durations validate bounds.
- **NB-08-T03 (integration):** Duplicate finish/start requests and concurrent tabs cannot create duplicate active sessions or outcomes.
- **NB-08-T04 (component):** Leaving full-screen mode preserves the compact timer and draft intention.
- **NB-08-T05 (component):** Capturing a thought or reading a linked note does not trigger timer shortcuts or lose task context.
- **NB-08-T06 (e2e):** Start, pause, reload, resume and record Made progress; task stays active and review receives the session once.

Before automated tests: obtain approval, create the named task branch, record base SHA, append this task's approved entry to the module ledger, and confirm the linked section test plan exists. Write the relevant tests and run them against the pre-change behavior. Record the expected behavioral red result before implementation; missing dependencies/database/browsers do not qualify as red. For acceptance tests of already-implemented behavior, record a genuine initial pass rather than manufacturing a failure; any required fix follows a failing regression and the approved scope.

Implement in small red/green/refactor slices. Targeted commands use the module directory under `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/component/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/` or `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/` according to the case type. NB-02 provides the executable scripts. Do not report a command as passing before it exists and runs.

## Risks, choices and external prerequisites

Wall-clock changes and offline updates require version-aware reconciliation. Preserve an explicit recovery state when the server cannot be reached; never present a locally queued session result as confirmed server data.

The product choices in this plan are proposed rulings covered by approval of this named task. Unavailable infrastructure remains an explicit blocker to its associated gate; it never justifies silently dropping scope or replacing the stack. Any material expansion requires a successor plan/approval.

## Verification and completion record

Required: formatting of changed code/current docs, TypeScript, ESLint with zero warnings/errors, the full existing/new unit/component suite, affected database/browser suites, Prisma validation for schema changes, and the integrated production build. Never weaken tests/config to pass. Store actual red/green logs in `/Users/pranav/Pranav_projects/github/no-brainy/evidences/focus/durable-sessions/` only after Git ignoring is verified.

Results: NOT RUN. Approval: Owner’s 2026-10-16 conversation message “approved.” covers this named plan and the dependencies explicitly listed in NB-02. Implementation: NOT STARTED. Update only this task's newly introduced ledger section with outcomes before landing. Push/PR/review/merge/deployment remain separate authorization gates.
