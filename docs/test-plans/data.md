# Data test-plan ledger

Append-only after a section lands on its recorded target branch. This section is a proposed test plan, not an executed test result.

## NB-13 — Personal setup and portable core workspace data, proposed 2026-10-16

Plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/data/personal-setup-and-backup.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/data/personal-setup-and-backup.md>)
Approval: Pending. Automated tests: Not written. Results: Not run.

### Coverage and acceptance

- **NB-13-T01 (unit):** Export schema omits secrets and includes the documented core scope with a version identifier.
- **NB-13-T02 (unit):** Import rejects invalid/oversized/future-schema data and dangling references before mutation.
- **NB-13-T03 (integration):** Export/import round trip preserves core relationships under remapped owned IDs and rolls back on failure.
- **NB-13-T04 (integration):** Repeated import confirmation cannot duplicate a completed receipt; another owner export endpoint is inaccessible.
- **NB-13-T05 (component):** Timezone and motion preferences survive reload; import preview performs no write until confirmation.
- **NB-13-T06 (e2e):** Download a core backup, preview its import in an isolated test account and verify the scoped round trip.

### Locations and fixtures

Place each case in its matching module/type directory:
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/data/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/data/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/data/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/data/`

Use fixed clocks where time matters, deterministic IDs and authenticated test-user fixtures. Integration tests use an explicitly disposable PostgreSQL database and enforce owner separation. External AI/storage/metadata responses are mocked unless a separately authorized live verification is recorded. Component tests use roles/labels and stable entity-boundary IDs. Browser tests use real local app/API behavior and do not bypass product authentication.

### Red/green protocol

After explicit approval and task-ledger activation, write the named tests first. Confirm the expected behavioral failure before changing implementation. Distinguish tooling/network/database failures from a red assertion. Preserve legacy assertions, implement, rerun targeted tests, refactor while green, then run the full relevant suites and static/build gates. Existing behavior tests that pass initially remain valid; do not manufacture failure.

### Evidence and completion

Record actual commands, baseline SHA, red reason, green results, environment and limitations in the new task-ledger section. Logs belong to `/Users/pranav/Pranav_projects/github/no-brainy/evidences/data/personal-setup-and-backup/` only after ignore verification. Screenshots are opt-in and disabled by default. No review report is authorized by this test plan.

Final results: PENDING — no tests have run for this task.

---

## Approval — 2026-10-16

The owner’s conversation message “approved.” approves the parent package, this section’s linked task plan, and the six developer packages listed in NB-02. The proposed section above is retained as the pre-approval record. Tests have not run at this approval checkpoint.

---

## NB-13 execution — 2026-10-16

All six acceptance areas completed. Record: /Users/pranav/Pranav_projects/github/no-brainy/docs/tasks/data.md. Final tests: 23 Node, 117 Vitest, 59 integration, 15 browser plus two post-fix targeted browser journeys passed. TypeScript, zero-warning lint, formatting, Prisma validation/generation and production build passed. Additive receipt migration applied without database resets. Evidence: /Users/pranav/Pranav_projects/github/no-brainy/evidences/data/personal-setup-and-backup/. Backup scope/skip rules and external-service limits remain explicit; no screenshots captured.
