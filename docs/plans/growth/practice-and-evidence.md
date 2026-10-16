# NB-09 — Growth through practice and evidence

Date: 2026-10-16 (Asia/Kolkata)
Status: APPROVED on 2026-10-16; implementation results are recorded in the task ledger.
Task branch: `feature/growth-practice-and-evidence`
Target/base SHA: Record immediately before implementation; intended to stack on completed dependencies without merging to main.
Future approved task ledger: `/Users/pranav/Pranav_projects/github/no-brainy/docs/tasks/growth.md`
Section test plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/growth.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/growth.md>)
Package: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md>)

## Predecessors, KT and behavioral delta

No historical module task plan exists at baseline `01845cfa639f843dfb59f87558acc176338bb4c8`. Existing specifications are background history, not proof of completion. The following package plans are dependencies/predecessors; preserve their inherited records. This task changes only the behavior described below:

- NB-05: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/projects/outcomes-and-routines.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/projects/outcomes-and-routines.md>)
- NB-07: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/planner/today-and-capacity.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/planner/today-and-capacity.md>)
- NB-08: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/focus/durable-sessions.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/focus/durable-sessions.md>)

Extend existing goals and their task relations with outcome description, practice commitments and evidence. Replace the current linked-task placeholder with actions. Reuse NB-05 routine occurrences and NB-08 focus results; do not revive removed habit tables.

KT and source references:
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/MyFocusHub_PRD.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/MyFocusHub_PRD.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE3_SPEC.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE3_SPEC.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/goals/[id]/page.tsx](</Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/goals/[id]/page.tsx>)
- [/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/books/[id]/page.tsx](</Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/books/[id]/page.tsx>)

## Scope and implementation sequence after approval

- Create a Growth home showing a small set of active goals, next actions, practice this week, evidence and due learning reviews. Keep explicit pause/archive/completion choices.
- Add editable success criteria, optional measurable baseline/target/unit, and weekly practice target. Display task completion separately from demonstrated goal progress.
- List real linked tasks/projects/notes and create a goal-linked next action from the goal itself. Include it on Today with an explicit planning choice.
- Record dated evidence with a short reflection and existing note/book/project/session links. Preserve source ownership and allow corrections without rewriting session history.
- Turn a book application note or manually chosen learning into a scheduled experiment and later reflection; AI extraction stays optional. Keep flashcard recall workflows accessible.
- Count practice through explicit routine/session evidence with one canonical identity, allow rest/skip/pause, and avoid double-counting a session linked to its task occurrence.

## Affected files and module boundaries

Existing paths below are inspection/implementation targets; not-yet-existing paths are proposed additions. Keep helpers in feature-specific source locations and avoid unrelated restructuring.

- `/Users/pranav/Pranav_projects/github/no-brainy/prisma/schema.prisma`
- `/Users/pranav/Pranav_projects/github/no-brainy/prisma/migrations`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/types/goals.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/validations/goals.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/api/goals`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/api/growth`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/hooks/use-goals.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components/goals`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components/growth`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/growth/page.tsx`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/goals`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components/ai/action-items-preview.tsx`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/growth`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/growth`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/growth`

## Dependencies and data/state changes

Extend Goal with optional successCriteria, baseline/target/unit and weeklyPracticeTarget. Add user-owned GrowthEvidence with goalId, observedAt, summary and optional owned source relation/measurement. Do not auto-complete a goal just because linked tasks finish. Existing financial-goal semantics remain explicit and separate.

Reuse the existing application stack and NB-02's explicitly approved test/development tools. No additional runtime library, external service, account change or cloud action is approved by this plan. Preserve authenticated-owner boundaries, current API envelopes and server/client separation. Schema migrations, where specified, are additive and validated against a populated disposable baseline.

## UI, automation and accessibility

Goal-{id}, evidence-{id}, goal-next-action and goal-practice controls have stable boundaries. Show units and evidence dates. Progress never fabricates an outcome percentage from a task count. All fields beyond goal title remain optional.

Use stable domain identifiers for React keys; use role/name/label locators first and stable data-testid values at meaningful boundaries where needed. No localized text/random value is used as a React key or test ID. New/reworked UI gets loading, empty, error and retry states. Honor user motion preferences. Screenshots are not required or automatically created.

## TDD acceptance cases

- **NB-09-T01 (unit):** Task completion percentage and outcome measurement are separate; missing measurement is displayed as unknown.
- **NB-09-T02 (integration):** Adding/removing a linked task does not falsely mark an outcome achieved or erase evidence.
- **NB-09-T03 (integration):** Practice counts deduplicate linked task/session evidence and respect the selected week/timezone.
- **NB-09-T04 (component):** A goal creates and displays its next action immediately; pausing preserves evidence and suppresses nudges.
- **NB-09-T05 (component):** A book application becomes a sourced action without requiring an AI key.
- **NB-09-T06 (e2e):** Create a growth goal, schedule a practice action, finish a session and add evidence that survives reload.

Before automated tests: obtain approval, create the named task branch, record base SHA, append this task's approved entry to the module ledger, and confirm the linked section test plan exists. Write the relevant tests and run them against the pre-change behavior. Record the expected behavioral red result before implementation; missing dependencies/database/browsers do not qualify as red. For acceptance tests of already-implemented behavior, record a genuine initial pass rather than manufacturing a failure; any required fix follows a failing regression and the approved scope.

Implement in small red/green/refactor slices. Targeted commands use the module directory under `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/component/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/` or `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/` according to the case type. NB-02 provides the executable scripts. Do not report a command as passing before it exists and runs.

## Risks, choices and external prerequisites

Financial goals currently have additional amount semantics; do not apply a generic measurement formula to them. Keep existing goal statuses and IDs compatible. Avoid claiming that completion counts prove skill or health improvement.

The product choices in this plan are proposed rulings covered by approval of this named task. Unavailable infrastructure remains an explicit blocker to its associated gate; it never justifies silently dropping scope or replacing the stack. Any material expansion requires a successor plan/approval.

## Verification and completion record

Required: formatting of changed code/current docs, TypeScript, ESLint with zero warnings/errors, the full existing/new unit/component suite, affected database/browser suites, Prisma validation for schema changes, and the integrated production build. Never weaken tests/config to pass. Store actual red/green logs in `/Users/pranav/Pranav_projects/github/no-brainy/evidences/growth/practice-and-evidence/` only after Git ignoring is verified.

Results: NOT RUN. Approval: Owner’s 2026-10-16 conversation message “approved.” covers this named plan and the dependencies explicitly listed in NB-02. Implementation: NOT STARTED. Update only this task's newly introduced ledger section with outcomes before landing. Push/PR/review/merge/deployment remain separate authorization gates.
