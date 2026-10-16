# Inbox test-plan ledger

Append-only after a section lands on its recorded target branch. This section is a proposed test plan, not an executed test result.

## NB-06 — One Inbox and recoverable capture, proposed 2026-10-16

Plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/inbox/capture-and-process.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/inbox/capture-and-process.md>)
Approval: Pending. Automated tests: Not written. Results: Not run.

### Coverage and acceptance

- **NB-06-T01 (unit):** Draft content survives close/reopen and storage failure becomes a visible recoverable state.
- **NB-06-T02 (integration):** A conversion either saves the destination and capture link together or saves neither.
- **NB-06-T03 (integration):** Double submission and retry of the same client ID return one record.
- **NB-06-T04 (component):** Capture works without choosing a type, shows unsynced state correctly and retains content after failed save.
- **NB-06-T05 (component):** Processing an item preserves its source and links it to the chosen existing project.
- **NB-06-T06 (e2e):** Capture during a running focus session returns to that same session without resetting its timer.

### Locations and fixtures

Place each case in its matching module/type directory:
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/inbox/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/inbox/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/inbox/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/inbox/`

Use fixed clocks where time matters, deterministic IDs and authenticated test-user fixtures. Integration tests use an explicitly disposable PostgreSQL database and enforce owner separation. External AI/storage/metadata responses are mocked unless a separately authorized live verification is recorded. Component tests use roles/labels and stable entity-boundary IDs. Browser tests use real local app/API behavior and do not bypass product authentication.

### Red/green protocol

After explicit approval and task-ledger activation, write the named tests first. Confirm the expected behavioral failure before changing implementation. Distinguish tooling/network/database failures from a red assertion. Preserve legacy assertions, implement, rerun targeted tests, refactor while green, then run the full relevant suites and static/build gates. Existing behavior tests that pass initially remain valid; do not manufacture failure.

### Evidence and completion

Record actual commands, baseline SHA, red reason, green results, environment and limitations in the new task-ledger section. Logs belong to `/Users/pranav/Pranav_projects/github/no-brainy/evidences/inbox/capture-and-process/` only after ignore verification. Screenshots are opt-in and disabled by default. No review report is authorized by this test plan.

Final results: PENDING — no tests have run for this task.

---

## Approval — 2026-10-16

The owner’s conversation message “approved.” approves the parent package, this section’s linked task plan, and the six developer packages listed in NB-02. The proposed section above is retained as the pre-approval record. Tests have not run at this approval checkpoint.
