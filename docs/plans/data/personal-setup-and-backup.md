# NB-13 — Personal setup and portable core workspace data

Date: 2026-10-16 (Asia/Kolkata)
Status: APPROVED on 2026-10-16; implementation results are recorded in the task ledger.
Task branch: `feature/data-personal-setup-and-backup`
Target/base SHA: Record immediately before implementation; intended to stack on completed dependencies without merging to main.
Future approved task ledger: `/Users/pranav/Pranav_projects/github/no-brainy/docs/tasks/data.md`
Section test plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/data.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/data.md>)
Package: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md>)

## Predecessors, KT and behavioral delta

No historical module task plan exists at baseline `01845cfa639f843dfb59f87558acc176338bb4c8`. Existing specifications are background history, not proof of completion. The following package plans are dependencies/predecessors; preserve their inherited records. This task changes only the behavior described below:

- NB-06: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/inbox/capture-and-process.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/inbox/capture-and-process.md>)
- NB-09: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/growth/practice-and-evidence.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/growth/practice-and-evidence.md>)
- NB-10: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/reviews/reflection-to-action.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/reviews/reflection-to-action.md>)
- NB-12: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/library/preserve-and-integrate.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/library/preserve-and-integrate.md>)

Make the integrated personal app easy to configure and protect its core work/growth records. Extend NB-02 environment readiness and NB-12 settings without changing login credentials or production deployment.

KT and source references:
- [/Users/pranav/Pranav_projects/github/no-brainy/README.md](</Users/pranav/Pranav_projects/github/no-brainy/README.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/SECURITY.md](</Users/pranav/Pranav_projects/github/no-brainy/SECURITY.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/DEPLOYMENT.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/DEPLOYMENT.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/prisma/seed.ts](</Users/pranav/Pranav_projects/github/no-brainy/prisma/seed.ts>)

## Scope and implementation sequence after approval

- Add personal setup for saved timezone, work/personal defaults, optional working capacity, motion/sound preferences and review reminders. Existing data is retained; onboarding does not insert sample tasks without a deliberate demo choice.
- Provide a versioned core-workspace JSON export for captures, projects, tasks/routines, plans, goals/evidence, focus sessions, notes and reviews with their internal links.
- Exclude credentials, API keys, auth sessions and sensitive infrastructure configuration. Explicitly label the export scope: this is not a full cloud-file/Stash/finance backup or a database disaster-recovery archive.
- Support validated restore/import preview with counts, version checks, reference remapping and an explicit final confirmation. Run the accepted import transactionally with request idempotency; preserve current data and offer additive import rather than destructive replacement.
- Protect exports/imports with normal auth, ownership checks, size limits and schema validation. Do not automatically send data to an external backup destination.
- Update current README startup/use instructions with actual commands and local URL, clearly distinguishing required PostgreSQL/auth setup from optional AI/GCS/metadata configuration.

## Affected files and module boundaries

Existing paths below are inspection/implementation targets; not-yet-existing paths are proposed additions. Keep helpers in feature-specific source locations and avoid unrelated restructuring.

- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/settings`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components/settings`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/api/settings`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/api/data`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/data`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/validations/backup.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/types/backup.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/scripts/check-environment.mjs`
- `/Users/pranav/Pranav_projects/github/no-brainy/README.md`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/data`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/data`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/data`

## Dependencies and data/state changes

Versioned import/export DTOs for the listed core entities. Generate new owned IDs on additive import and remap relations in a transaction. Maintain export format version and import receipt; reject unrecognized future schemas instead of guessing.

Reuse the existing application stack and NB-02's explicitly approved test/development tools. No additional runtime library, external service, account change or cloud action is approved by this plan. Preserve authenticated-owner boundaries, current API envelopes and server/client separation. Schema migrations, where specified, are additive and validated against a populated disposable baseline.

## UI, automation and accessibility

Setup fields use plain explanations and reasonable editable defaults. Export displays its scope. Import uses preview then explicit confirm, with disabled double-submit and accessible result/error messages. Sensitive content never appears in a toast or log.

Use stable domain identifiers for React keys; use role/name/label locators first and stable data-testid values at meaningful boundaries where needed. No localized text/random value is used as a React key or test ID. New/reworked UI gets loading, empty, error and retry states. Honor user motion preferences. Screenshots are not required or automatically created.

## TDD acceptance cases

- **NB-13-T01 (unit):** Export schema omits secrets and includes the documented core scope with a version identifier.
- **NB-13-T02 (unit):** Import rejects invalid/oversized/future-schema data and dangling references before mutation.
- **NB-13-T03 (integration):** Export/import round trip preserves core relationships under remapped owned IDs and rolls back on failure.
- **NB-13-T04 (integration):** Repeated import confirmation cannot duplicate a completed receipt; another owner export endpoint is inaccessible.
- **NB-13-T05 (component):** Timezone and motion preferences survive reload; import preview performs no write until confirmation.
- **NB-13-T06 (e2e):** Download a core backup, preview its import in an isolated test account and verify the scoped round trip.

Before automated tests: obtain approval, create the named task branch, record base SHA, append this task's approved entry to the module ledger, and confirm the linked section test plan exists. Write the relevant tests and run them against the pre-change behavior. Record the expected behavioral red result before implementation; missing dependencies/database/browsers do not qualify as red. For acceptance tests of already-implemented behavior, record a genuine initial pass rather than manufacturing a failure; any required fix follows a failing regression and the approved scope.

Implement in small red/green/refactor slices. Targeted commands use the module directory under `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/component/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/` or `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/` according to the case type. NB-02 provides the executable scripts. Do not report a command as passing before it exists and runs.

## Risks, choices and external prerequisites

Import is a high-impact mutation and needs preview/confirmation in the product regardless of autonomous development authorization. Make the limited backup scope unmistakable; file-storage and full database recovery continue to use the existing deployment procedures.

The product choices in this plan are proposed rulings covered by approval of this named task. Unavailable infrastructure remains an explicit blocker to its associated gate; it never justifies silently dropping scope or replacing the stack. Any material expansion requires a successor plan/approval.

## Verification and completion record

Required: formatting of changed code/current docs, TypeScript, ESLint with zero warnings/errors, the full existing/new unit/component suite, affected database/browser suites, Prisma validation for schema changes, and the integrated production build. Never weaken tests/config to pass. Store actual red/green logs in `/Users/pranav/Pranav_projects/github/no-brainy/evidences/data/personal-setup-and-backup/` only after Git ignoring is verified.

Results: NOT RUN. Approval: Owner’s 2026-10-16 conversation message “approved.” covers this named plan and the dependencies explicitly listed in NB-02. Implementation: NOT STARTED. Update only this task's newly introduced ledger section with outcomes before landing. Push/PR/review/merge/deployment remain separate authorization gates.
