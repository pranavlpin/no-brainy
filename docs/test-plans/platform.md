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
