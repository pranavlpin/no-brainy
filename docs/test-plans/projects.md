# Projects test-plan ledger

Append-only after a section lands on its recorded target branch. This section is a proposed test plan, not an executed test result.

## NB-05 — Projects, planning metadata and dependable routines, proposed 2026-10-16

Plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/projects/outcomes-and-routines.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/projects/outcomes-and-routines.md>)
Approval: Pending. Automated tests: Not written. Results: Not run.

### Coverage and acceptance

- **NB-05-T01 (unit):** Recurrence handles daily, weekly, month-end, leap-year, pause and skipped-day boundaries deterministically.
- **NB-05-T02 (integration):** Repeated/concurrent completion produces one next occurrence while preserving the completed record.
- **NB-05-T03 (integration):** Existing populated data survives migrations; missing new optional fields retain usable defaults.
- **NB-05-T04 (integration):** A project/task cannot reference another owner goal/project/parent.
- **NB-05-T05 (component):** A title-only task can be created, then linked to a project and goal without forcing extra fields.
- **NB-05-T06 (component):** Scheduling a task for Tuesday does not change its Friday deadline; project archive preserves historical records.

### Locations and fixtures

Place each case in its matching module/type directory:
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/projects/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/projects/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/projects/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/projects/`

Use fixed clocks where time matters, deterministic IDs and authenticated test-user fixtures. Integration tests use an explicitly disposable PostgreSQL database and enforce owner separation. External AI/storage/metadata responses are mocked unless a separately authorized live verification is recorded. Component tests use roles/labels and stable entity-boundary IDs. Browser tests use real local app/API behavior and do not bypass product authentication.

### Red/green protocol

After explicit approval and task-ledger activation, write the named tests first. Confirm the expected behavioral failure before changing implementation. Distinguish tooling/network/database failures from a red assertion. Preserve legacy assertions, implement, rerun targeted tests, refactor while green, then run the full relevant suites and static/build gates. Existing behavior tests that pass initially remain valid; do not manufacture failure.

### Evidence and completion

Record actual commands, baseline SHA, red reason, green results, environment and limitations in the new task-ledger section. Logs belong to `/Users/pranav/Pranav_projects/github/no-brainy/evidences/projects/outcomes-and-routines/` only after ignore verification. Screenshots are opt-in and disabled by default. No review report is authorized by this test plan.

Final results: PENDING — no tests have run for this task.

---

## Approval — 2026-10-16

The owner’s conversation message “approved.” approves the parent package, this section’s linked task plan, and the six developer packages listed in NB-02. The proposed section above is retained as the pre-approval record. Tests have not run at this approval checkpoint.
