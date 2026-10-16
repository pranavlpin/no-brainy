# NB-02 — React TDD foundation and runnable environment

Date: 2026-10-16 (Asia/Kolkata)
Status: APPROVED on 2026-10-16; implementation results are recorded in the task ledger.
Task branch: `test/platform-react-tdd-foundation`
Target/base SHA: Record immediately before implementation; intended to stack on completed dependencies without merging to main.
Future approved task ledger: `/Users/pranav/Pranav_projects/github/no-brainy/docs/tasks/platform.md`
Section test plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/platform.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/platform.md>)
Package: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md>)

## Predecessors, KT and behavioral delta

No historical module task plan exists at baseline `01845cfa639f843dfb59f87558acc176338bb4c8`. Existing specifications are background history, not proof of completion. The following package plans are dependencies/predecessors; preserve their inherited records. This task changes only the behavior described below:

- NB-01: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/workflow/react-governance.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/workflow/react-governance.md>)

The current package has Vitest/jsdom but no Testing Library or Playwright, and test discovery is limited to the source tree. Establish the documented React test stack and truthful runnable gates before feature work. The workflow bootstrap tests from NB-01 remain active.

KT and source references:
- [/Users/pranav/Pranav_projects/github/no-brainy/package.json](</Users/pranav/Pranav_projects/github/no-brainy/package.json>)
- [/Users/pranav/Pranav_projects/github/no-brainy/pnpm-lock.yaml](</Users/pranav/Pranav_projects/github/no-brainy/pnpm-lock.yaml>)
- [/Users/pranav/Pranav_projects/github/no-brainy/vitest.config.ts](</Users/pranav/Pranav_projects/github/no-brainy/vitest.config.ts>)
- [/Users/pranav/Pranav_projects/github/no-brainy/CONTRIBUTING.md](</Users/pranav/Pranav_projects/github/no-brainy/CONTRIBUTING.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/TECHNICAL_SPEC.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/TECHNICAL_SPEC.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/DEPLOYMENT.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/DEPLOYMENT.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/.github/workflows-disabled/ci.yml](</Users/pranav/Pranav_projects/github/no-brainy/.github/workflows-disabled/ci.yml>)

## Scope and implementation sequence after approval

- Request package approval through this written package for developer-only @testing-library/react, @testing-library/dom, @testing-library/user-event, @testing-library/jest-dom, @playwright/test and prettier. Choose React-18-compatible versions, pin them through pnpm, and keep the dependency change in its own commit. Add no production dependency.
- Use a local pnpm bootstrap when available; never install globally or change protected laptop settings without the applicable authorization. Retain the existing pnpm lockfile and overrides. Validate Node/Next compatibility before installing.
- Move the three existing test files into module/type directories with assertion bodies preserved. Verify their new discovery, and do not silently drop the Node governance suite. Keep shared fixtures in a platform module.
- Add explicit typecheck, formatting, zero-warning lint, unit/component, database integration and browser scripts. Correct any unsupported command through this task rather than claiming its execution. Format checks cover changed code/current docs and exclude immutable history.
- Detect missing environment variables without displaying values. Use a separate local development database and a disposable integration database with a safety guard against an unknown/production target. Generate Prisma and apply migrations to the isolated databases only.
- Establish deterministic authentication fixtures for tests, not an application auth bypass. Real local use retains registration/sign-in. Do not run the existing demo seed into unknown data.
- Route browser traces/logs/downloads to ignored evidence; disable automatic screenshots. Document a verified local startup command and readiness endpoint behavior. Leave deployment workflows disabled.

## Affected files and module boundaries

Existing paths below are inspection/implementation targets; not-yet-existing paths are proposed additions. Keep helpers in feature-specific source locations and avoid unrelated restructuring.

- `/Users/pranav/Pranav_projects/github/no-brainy/package.json`
- `/Users/pranav/Pranav_projects/github/no-brainy/pnpm-lock.yaml`
- `/Users/pranav/Pranav_projects/github/no-brainy/vitest.config.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/playwright.config.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/.prettierignore`
- `/Users/pranav/Pranav_projects/github/no-brainy/.prettierrc.json`
- `/Users/pranav/Pranav_projects/github/no-brainy/scripts/check-environment.mjs`
- `/Users/pranav/Pranav_projects/github/no-brainy/scripts/check-format.mjs`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/platform`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/platform`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/platform`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/platform`

## Dependencies and data/state changes

No product schema change. Isolate test accounts and fixture cleanup to the disposable test database. Store only test configuration placeholders in committed files; actual local secrets remain ignored.

Reuse the existing application stack and NB-02's explicitly approved test/development tools. No additional runtime library, external service, account change or cloud action is approved by this plan. Preserve authenticated-owner boundaries, current API envelopes and server/client separation. Schema migrations, where specified, are additive and validated against a populated disposable baseline.

## UI, automation and accessibility

Test harnesses use semantic role/name queries and stable data-testid boundaries. No product appearance change in this task.

Use stable domain identifiers for React keys; use role/name/label locators first and stable data-testid values at meaningful boundaries where needed. No localized text/random value is used as a React key or test ID. New/reworked UI gets loading, empty, error and retry states. Honor user motion preferences. Screenshots are not required or automatically created.

## TDD acceptance cases

- **NB-02-T01 (unit):** The bootstrap verifier reports missing configuration/dependency capabilities without exposing secret values.
- **NB-02-T02 (unit):** The test inventory includes every legacy assertion file and the governance Node suite after relocation.
- **NB-02-T03 (integration):** The database cleanup guard refuses production-like or unapproved database targets.
- **NB-02-T04 (component):** A real shared button/dialog interaction is exercised by React Testing Library; accessible interaction and cleanup work.
- **NB-02-T05 (e2e):** Normal test registration/sign-in reaches an authenticated existing page; unauthorized API access returns 401.

Before automated tests: obtain approval, create the named task branch, record base SHA, append this task's approved entry to the module ledger, and confirm the linked section test plan exists. Write the relevant tests and run them against the pre-change behavior. Record the expected behavioral red result before implementation; missing dependencies/database/browsers do not qualify as red. For acceptance tests of already-implemented behavior, record a genuine initial pass rather than manufacturing a failure; any required fix follows a failing regression and the approved scope.

Implement in small red/green/refactor slices. Targeted commands use the module directory under `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/component/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/` or `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/` according to the case type. NB-02 provides the executable scripts. Do not report a command as passing before it exists and runs.

## Risks, choices and external prerequisites

Registry DNS currently fails; no pnpm/Docker/PostgreSQL command or development environment file was found. These are unresolved runtime prerequisites, not failing behavior tests. Resolve through available authorized tooling; if an external setup action is required, report its exact command without changing architecture. Package versions and any browser binaries require successful downloads before tests can be claimed.

The product choices in this plan are proposed rulings covered by approval of this named task. Unavailable infrastructure remains an explicit blocker to its associated gate; it never justifies silently dropping scope or replacing the stack. Any material expansion requires a successor plan/approval.

## Verification and completion record

Required: formatting of changed code/current docs, TypeScript, ESLint with zero warnings/errors, the full existing/new unit/component suite, affected database/browser suites, Prisma validation for schema changes, and the integrated production build. Never weaken tests/config to pass. Store actual red/green logs in `/Users/pranav/Pranav_projects/github/no-brainy/evidences/platform/react-tdd-foundation/` only after Git ignoring is verified.

Results: NOT RUN. Approval: Owner’s 2026-10-16 conversation message “approved.” covers this named plan and the dependencies explicitly listed in NB-02. Implementation: NOT STARTED. Update only this task's newly introduced ledger section with outcomes before landing. Push/PR/review/merge/deployment remain separate authorization gates.
