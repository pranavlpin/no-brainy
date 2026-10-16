# Tasks test-plan ledger

Append-only after a section lands on its recorded target branch. This section is a proposed test plan, not an executed test result.

## NB-03 — Task discovery, date contracts, and reliable saves, proposed 2026-10-16

Plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/tasks/persistence-and-discovery.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/tasks/persistence-and-discovery.md>)
Approval: Pending. Automated tests: Not written. Results: Not run.

### Coverage and acceptance

- **NB-03-T01 (unit):** Calendar normalization accepts valid date-only and compatible ISO inputs, rejects impossible dates, and computes Today correctly around India midnight.
- **NB-03-T02 (unit):** Autosave merges title and priority changes within 800 ms, preserves retry content, and handles responses arriving out of order.
- **NB-03-T03 (integration):** The active query returns pending and in-progress tasks over multiple pages with correct numeric priority order and bounded date filters.
- **NB-03-T04 (component):** Completing a task updates its planner representation immediately and rolls back on server failure.
- **NB-03-T05 (component):** Typing then navigating preserves the note draft; a reload/retry recovers the newest content without replacing a newer remote version.
- **NB-03-T06 (integration):** Task, parent and linked-goal ownership are enforced in affected mutation paths.

### Locations and fixtures

Place each case in its matching module/type directory:
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/tasks/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/tasks/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/tasks/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/tasks/`

Use fixed clocks where time matters, deterministic IDs and authenticated test-user fixtures. Integration tests use an explicitly disposable PostgreSQL database and enforce owner separation. External AI/storage/metadata responses are mocked unless a separately authorized live verification is recorded. Component tests use roles/labels and stable entity-boundary IDs. Browser tests use real local app/API behavior and do not bypass product authentication.

### Red/green protocol

After explicit approval and task-ledger activation, write the named tests first. Confirm the expected behavioral failure before changing implementation. Distinguish tooling/network/database failures from a red assertion. Preserve legacy assertions, implement, rerun targeted tests, refactor while green, then run the full relevant suites and static/build gates. Existing behavior tests that pass initially remain valid; do not manufacture failure.

### Evidence and completion

Record actual commands, baseline SHA, red reason, green results, environment and limitations in the new task-ledger section. Logs belong to `/Users/pranav/Pranav_projects/github/no-brainy/evidences/tasks/persistence-and-discovery/` only after ignore verification. Screenshots are opt-in and disabled by default. No review report is authorized by this test plan.

Final results: PENDING — no tests have run for this task.

---

## Approval — 2026-10-16

The owner’s conversation message “approved.” approves the parent package, this section’s linked task plan, and the six developer packages listed in NB-02. The proposed section above is retained as the pre-approval record. Tests have not run at this approval checkpoint.
