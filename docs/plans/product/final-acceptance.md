# NB-14 — Integrated product acceptance and usable handoff

Date: 2026-10-16 (Asia/Kolkata)
Status: APPROVED on 2026-10-16; implementation results are recorded in the task ledger.
Task branch: `test/product-final-acceptance`
Target/base SHA: Record immediately before implementation; intended to stack on completed dependencies without merging to main.
Future approved task ledger: `/Users/pranav/Pranav_projects/github/no-brainy/docs/tasks/product.md`
Section test plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/product.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/product.md>)
Package: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md>)

## Predecessors, KT and behavioral delta

No historical module task plan exists at baseline `01845cfa639f843dfb59f87558acc176338bb4c8`. Existing specifications are background history, not proof of completion. The following package plans are dependencies/predecessors; preserve their inherited records. This task changes only the behavior described below:

- NB-01: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/workflow/react-governance.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/workflow/react-governance.md>)
- NB-02: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/platform/react-tdd-foundation.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/platform/react-tdd-foundation.md>)
- NB-03: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/tasks/persistence-and-discovery.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/tasks/persistence-and-discovery.md>)
- NB-04: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/design/personal-workspace.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/design/personal-workspace.md>)
- NB-05: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/projects/outcomes-and-routines.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/projects/outcomes-and-routines.md>)
- NB-06: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/inbox/capture-and-process.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/inbox/capture-and-process.md>)
- NB-07: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/planner/today-and-capacity.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/planner/today-and-capacity.md>)
- NB-08: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/focus/durable-sessions.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/focus/durable-sessions.md>)
- NB-09: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/growth/practice-and-evidence.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/growth/practice-and-evidence.md>)
- NB-10: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/reviews/reflection-to-action.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/reviews/reflection-to-action.md>)
- NB-11: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/ai/contextual-assistance.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/ai/contextual-assistance.md>)
- NB-12: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/library/preserve-and-integrate.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/library/preserve-and-integrate.md>)
- NB-13: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/data/personal-setup-and-backup.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/data/personal-setup-and-backup.md>)

Verify the entire approved stack of module changes as a usable authenticated personal app. This is an acceptance-testing task, not an authorization to conduct a code review, push, merge or deploy.

KT and source references:
- [/Users/pranav/Pranav_projects/github/no-brainy/README.md](</Users/pranav/Pranav_projects/github/no-brainy/README.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/DEPLOYMENT.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/DEPLOYMENT.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/repository-kt.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/repository-kt.md>)

## Scope and implementation sequence after approval

- Exercise the complete capture → task/project → Today → focus → growth evidence → daily/weekly reflection journey through the real application and disposable database.
- Cover empty first use, existing populated data, more than one page of tasks, partial completion, refresh recovery, failed writes, retry, keyboard operation, narrow layouts and reduced motion.
- Run migration upgrade tests against a populated baseline and the preserved-module smoke matrix. Verify no dependency on an AI key for the manual journey.
- Run formatter checks, strict type checking, zero-warning/error lint, Prisma validation/generation, all unit/component/integration/browser suites and production build. Distinguish gate failures from unavailable environment prerequisites.
- Prepare reproducible local startup/stop instructions, a verified URL, a short first-use walkthrough and precise remaining limitations. Do not call a static mockup or sample-data-only page the final product.
- Record final task statuses and evidence paths without editing inherited task/plan history. Any new out-of-scope defect needs its own successor plan/approval before implementation.
- Keep screenshot creation disabled unless separately requested. Do not launch a review or create a report just because verification finishes.

## Affected files and module boundaries

Existing paths below are inspection/implementation targets; not-yet-existing paths are proposed additions. Keep helpers in feature-specific source locations and avoid unrelated restructuring.

- `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/product`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/product`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/product`
- `/Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/product.md`
- `/Users/pranav/Pranav_projects/github/no-brainy/docs/tasks/product.md`
- `/Users/pranav/Pranav_projects/github/no-brainy/README.md`

## Dependencies and data/state changes

Only isolated test fixtures and optional user-controlled setup data; no production writes, resets, hidden seed imports or credential changes. Test backup restore in a disposable account/database.

Reuse the existing application stack and NB-02's explicitly approved test/development tools. No additional runtime library, external service, account change or cloud action is approved by this plan. Preserve authenticated-owner boundaries, current API envelopes and server/client separation. Schema migrations, where specified, are additive and validated against a populated disposable baseline.

## UI, automation and accessibility

Browser checks cover 360/768/1440 px, keyboard focus, screen-reader semantics at primary boundaries, dark/light appearance and reduced motion. Measure responsiveness in actual interactions; do not manufacture a performance score.

Use stable domain identifiers for React keys; use role/name/label locators first and stable data-testid values at meaningful boundaries where needed. No localized text/random value is used as a React key or test ID. New/reworked UI gets loading, empty, error and retry states. Honor user motion preferences. Screenshots are not required or automatically created.

## TDD acceptance cases

- **NB-14-T01 (e2e):** Complete the full daily and weekly journey with reloads and no AI key using real authenticated endpoints.
- **NB-14-T02 (e2e):** A 50-task fixture remains navigable; status, save failures, retries and planner cross-view updates are correct.
- **NB-14-T03 (integration):** Applying all additive migrations preserves populated baseline module records and relations.
- **NB-14-T04 (e2e):** Focus survives pause/reload/tab changes and records exactly one partial/completed result.
- **NB-14-T05 (e2e):** Legacy Library/Life paths and settings work in desktop and mobile layouts.
- **NB-14-T06 (e2e):** First-use setup, local startup and scoped export/restore are usable and truthfully documented.

Before automated tests: obtain approval, create the named task branch, record base SHA, append this task's approved entry to the module ledger, and confirm the linked section test plan exists. Write the relevant tests and run them against the pre-change behavior. Record the expected behavioral red result before implementation; missing dependencies/database/browsers do not qualify as red. For acceptance tests of already-implemented behavior, record a genuine initial pass rather than manufacturing a failure; any required fix follows a failing regression and the approved scope.

Implement in small red/green/refactor slices. Targeted commands use the module directory under `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/component/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/` or `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/` according to the case type. NB-02 provides the executable scripts. Do not report a command as passing before it exists and runs.

## Risks, choices and external prerequisites

Existing successful component tests do not replace end-to-end verification. If a required gate cannot run, keep this task incomplete and report the concrete blocker. Local acceptance does not imply production deployment, external integration validation or code-review approval.

The product choices in this plan are proposed rulings covered by approval of this named task. Unavailable infrastructure remains an explicit blocker to its associated gate; it never justifies silently dropping scope or replacing the stack. Any material expansion requires a successor plan/approval.

## Verification and completion record

Required: formatting of changed code/current docs, TypeScript, ESLint with zero warnings/errors, the full existing/new unit/component suite, affected database/browser suites, Prisma validation for schema changes, and the integrated production build. Never weaken tests/config to pass. Store actual red/green logs in `/Users/pranav/Pranav_projects/github/no-brainy/evidences/product/final-acceptance/` only after Git ignoring is verified.

Results: NOT RUN. Approval: Owner’s 2026-10-16 conversation message “approved.” covers this named plan and the dependencies explicitly listed in NB-02. Implementation: NOT STARTED. Update only this task's newly introduced ledger section with outcomes before landing. Push/PR/review/merge/deployment remain separate authorization gates.
