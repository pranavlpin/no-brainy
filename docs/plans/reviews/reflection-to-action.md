# NB-10 — Daily shutdown and weekly adjustment

Date: 2026-10-16 (Asia/Kolkata)
Status: APPROVED on 2026-10-16; implementation results are recorded in the task ledger.
Task branch: `feature/reviews-reflection-to-action`
Target/base SHA: Record immediately before implementation; intended to stack on completed dependencies without merging to main.
Future approved task ledger: `/Users/pranav/Pranav_projects/github/no-brainy/docs/tasks/reviews.md`
Section test plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/reviews.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/reviews.md>)
Package: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md>)

## Predecessors, KT and behavioral delta

No historical module task plan exists at baseline `01845cfa639f843dfb59f87558acc176338bb4c8`. Existing specifications are background history, not proof of completion. The following package plans are dependencies/predecessors; preserve their inherited records. This task changes only the behavior described below:

- NB-07: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/planner/today-and-capacity.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/planner/today-and-capacity.md>)
- NB-08: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/focus/durable-sessions.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/focus/durable-sessions.md>)
- NB-09: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/growth/practice-and-evidence.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/growth/practice-and-evidence.md>)

Evolve current statistics/reflection/mood forms into an actionable close-of-day and weekly planning flow, retaining all prior reflection text. Reuse NB-07 scheduling, NB-08 partial progress and NB-09 evidence.

KT and source references:
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/MyFocusHub_PRD.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/MyFocusHub_PRD.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/TECHNICAL_SPEC.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/TECHNICAL_SPEC.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE2_SPEC.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE2_SPEC.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/reviews/daily/page.tsx](</Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/reviews/daily/page.tsx>)

## Scope and implementation sequence after approval

- Provide a short daily flow: what moved forward, what got in the way, tomorrow first action; mood and longer writing are optional.
- Show completed work and partial focus outcomes, then let the user intentionally reschedule/split/drop unfinished tasks without changing deadlines.
- Persist drafts, save structured responses while preserving legacy reflectionMd, and show accurate save/retry states. Prevent AI summaries from silently overwriting unsaved reflection.
- Build weekly adjustment with goal/project progress, practice, obstacles, one stop/continue/start experiment, and next-week outcomes. Keep a small number of chosen commitments.
- Use saved timezone and explicit date/week keys. Permit reviewing an earlier day; never silently switch it at midnight.
- Make notifications optional with quiet hours/preferences; paused goals/routines do not generate pressure. Use existing notification infrastructure and do not promise background push without its verified service setup.

## Affected files and module boundaries

Existing paths below are inspection/implementation targets; not-yet-existing paths are proposed additions. Keep helpers in feature-specific source locations and avoid unrelated restructuring.

- `/Users/pranav/Pranav_projects/github/no-brainy/prisma/schema.prisma`
- `/Users/pranav/Pranav_projects/github/no-brainy/prisma/migrations`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/types/reviews.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/validations/reviews.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/api/reviews`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/hooks/use-reviews.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components/reviews`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/reviews`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components/planner`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/reviews`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/reviews`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/reviews`

## Dependencies and data/state changes

Add optional structured daily answers and tomorrowTaskId to DailyReview. New user-owned WeeklyReview keyed uniquely by owner/weekStart with reflection, experiment and selected outcomes. Historical daily reviews remain readable and are not rewritten. Statistics derive from bounded events/date ranges.

Reuse the existing application stack and NB-02's explicitly approved test/development tools. No additional runtime library, external service, account change or cloud action is approved by this plan. Preserve authenticated-owner boundaries, current API envelopes and server/client separation. Schema migrations, where specified, are additive and validated against a populated disposable baseline.

## UI, automation and accessibility

Step controls and review-date selection use labels, logical focus progression and accessible validation. Keep review save available, allow skipping optional prompts and returning later. Stable IDs use the reviewed date/week.

Use stable domain identifiers for React keys; use role/name/label locators first and stable data-testid values at meaningful boundaries where needed. No localized text/random value is used as a React key or test ID. New/reworked UI gets loading, empty, error and retry states. Honor user motion preferences. Screenshots are not required or automatically created.

## TDD acceptance cases

- **NB-10-T01 (unit):** Daily/weekly ranges respect Asia/Kolkata and exclude out-of-range activity.
- **NB-10-T02 (integration):** Saving a reflection plus tomorrow action is consistent and retry-safe; historical text survives migration.
- **NB-10-T03 (component):** Optional mood/questions can be skipped and a failed save retains all responses.
- **NB-10-T04 (component):** Rescheduling from shutdown changes planned day only and shows the result in Today.
- **NB-10-T05 (integration):** Paused routines and quiet-hour preferences suppress the relevant optional nudges.
- **NB-10-T06 (e2e):** Finish a daily review, reload it, complete a weekly adjustment and see the chosen next action on the intended day.

Before automated tests: obtain approval, create the named task branch, record base SHA, append this task's approved entry to the module ledger, and confirm the linked section test plan exists. Write the relevant tests and run them against the pre-change behavior. Record the expected behavioral red result before implementation; missing dependencies/database/browsers do not qualify as red. For acceptance tests of already-implemented behavior, record a genuine initial pass rather than manufacturing a failure; any required fix follows a failing regression and the approved scope.

Implement in small red/green/refactor slices. Targeted commands use the module directory under `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/component/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/` or `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/` according to the case type. NB-02 provides the executable scripts. Do not report a command as passing before it exists and runs.

## Risks, choices and external prerequisites

Reviews must not rely on a stale snapshot for live progress. Protect existing reflection text and avoid automatically assigning causes to mood. Background notification capability is constrained by actual configured infrastructure.

The product choices in this plan are proposed rulings covered by approval of this named task. Unavailable infrastructure remains an explicit blocker to its associated gate; it never justifies silently dropping scope or replacing the stack. Any material expansion requires a successor plan/approval.

## Verification and completion record

Required: formatting of changed code/current docs, TypeScript, ESLint with zero warnings/errors, the full existing/new unit/component suite, affected database/browser suites, Prisma validation for schema changes, and the integrated production build. Never weaken tests/config to pass. Store actual red/green logs in `/Users/pranav/Pranav_projects/github/no-brainy/evidences/reviews/reflection-to-action/` only after Git ignoring is verified.

Results: NOT RUN. Approval: Owner’s 2026-10-16 conversation message “approved.” covers this named plan and the dependencies explicitly listed in NB-02. Implementation: NOT STARTED. Update only this task's newly introduced ledger section with outcomes before landing. Push/PR/review/merge/deployment remain separate authorization gates.
