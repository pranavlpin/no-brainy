# Platform test-plan ledger

Append-only after a section lands on its recorded target branch. This section is a proposed test plan, not an executed test result.

## NB-02 — React TDD foundation and runnable environment, proposed 2026-10-16

Plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/platform/react-tdd-foundation.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/platform/react-tdd-foundation.md>)
Approval: Pending. Automated tests: Not written. Results: Not run.

### Coverage and acceptance

- **NB-02-T01 (unit):** The bootstrap verifier reports missing configuration/dependency capabilities without exposing secret values.
- **NB-02-T02 (unit):** The test inventory includes every legacy assertion file and the governance Node suite after relocation.
- **NB-02-T03 (integration):** The database cleanup guard refuses production-like or unapproved database targets.
- **NB-02-T04 (component):** A real shared button/dialog interaction is exercised by React Testing Library; accessible interaction and cleanup work.
- **NB-02-T05 (e2e):** Normal test registration/sign-in reaches an authenticated existing page; unauthorized API access returns 401.

### Locations and fixtures

Place each case in its matching module/type directory:
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/platform/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/platform/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/platform/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/platform/`

Use fixed clocks where time matters, deterministic IDs and authenticated test-user fixtures. Integration tests use an explicitly disposable PostgreSQL database and enforce owner separation. External AI/storage/metadata responses are mocked unless a separately authorized live verification is recorded. Component tests use roles/labels and stable entity-boundary IDs. Browser tests use real local app/API behavior and do not bypass product authentication.

### Red/green protocol

After explicit approval and task-ledger activation, write the named tests first. Confirm the expected behavioral failure before changing implementation. Distinguish tooling/network/database failures from a red assertion. Preserve legacy assertions, implement, rerun targeted tests, refactor while green, then run the full relevant suites and static/build gates. Existing behavior tests that pass initially remain valid; do not manufacture failure.

### Evidence and completion

Record actual commands, baseline SHA, red reason, green results, environment and limitations in the new task-ledger section. Logs belong to `/Users/pranav/Pranav_projects/github/no-brainy/evidences/platform/react-tdd-foundation/` only after ignore verification. Screenshots are opt-in and disabled by default. No review report is authorized by this test plan.

Final results: PENDING — no tests have run for this task.

---

## Approval — 2026-10-16

The owner’s conversation message “approved.” approves the parent package, this section’s linked task plan, and the six developer packages listed in NB-02. The proposed section above is retained as the pre-approval record. Tests have not run at this approval checkpoint.

---

## NB-02 bootstrap execution — 2026-10-16

- NB-02-T01: Seven Node cases pass for missing/valid/redacted configuration, template rejection, runtime minimum, test-mode isolation and CLI failure status.
- NB-02-T03: Seven Node cases pass for confirmation, local target restriction, development separation, malformed/ambiguous connection rejection and credential-free CLI diagnostics. These exercise the guard and subprocess, not a running PostgreSQL server.
- Initial red: 12 planned-implementation assertions failed. First green: 12 passed. Added override regression: 13 passed/1 failed; after the fix, the complete Node bootstrap suite passes 20 checks including six unchanged workflow checks.
- Exact combined command, run from `/Users/pranav/Pranav_projects/github/no-brainy`: `node --test /Users/pranav/Pranav_projects/github/no-brainy/test/unit/workflow/governance.test.mjs /Users/pranav/Pranav_projects/github/no-brainy/test/unit/platform/check-environment.test.mjs /Users/pranav/Pranav_projects/github/no-brainy/test/integration/platform/test-database.test.mjs`.
- Evidence: `/Users/pranav/Pranav_projects/github/no-brainy/evidences/platform/react-tdd-foundation/`. Node syntax and Git whitespace checks pass.
- Still blocked: T02 test migration/discovery, T04 React component harness, T05 authenticated browser journey, real database tests, lint/typecheck/formatter/build. No dependency downloads or actual database access are available.
- Runtime minimum checked against https://vite.dev/guide/ and the existing Vite dependency; supported-version diagnosis does not claim that all packages have executed on this Node version.

---

## NB-02 formatter boundary cases — 2026-10-16

Before implementing the approved changed-file formatter, verify that candidate selection includes current code and public documentation, but excludes immutable plan/task/test-plan history, generated lockfiles, private environment files and ignored evidence. Add these Node cases under `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/platform/check-format.test.mjs`, confirm red, then implement `/Users/pranav/Pranav_projects/github/no-brainy/scripts/check-format.mjs`.


---

## NB-02 full foundation verification — 2026-10-16

Package/network/database prerequisites are resolved. T01–T05 now execute: 23 Node checks, 19 Vitest tests (18 preserved legacy assertions plus component interaction), one live PostgreSQL integration case and one Chromium auth journey pass. TypeScript, changed-file formatting and the baseline production build pass. The formatter exclusion case was red before implementation; test-discovery/script cases were red before relocation/configuration. Real database and component/auth acceptance initially passed and were not artificially made red.

Global ESLint remains red on five pre-existing warnings assigned to NB-03/NB-12. No warning suppression was added. Exact logs and environment details are linked in `/Users/pranav/Pranav_projects/github/no-brainy/docs/tasks/platform.md`. Screenshots and browser traces remained off.
