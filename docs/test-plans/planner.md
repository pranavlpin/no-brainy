# Planner test-plan ledger

Append-only after a section lands on its recorded target branch. This section is a proposed test plan, not an executed test result.

## NB-07 — Today, deliberate planning and editable time blocks, proposed 2026-10-16

Plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/planner/today-and-capacity.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/planner/today-and-capacity.md>)
Approval: Pending. Automated tests: Not written. Results: Not run.

### Coverage and acceptance

- **NB-07-T01 (unit):** Capacity accounts for estimated time, buffers and unknown estimates without claiming an impossible fit.
- **NB-07-T02 (integration):** An undated active task can be selected; cancelled/completed/foreign tasks and more than three focus IDs are rejected.
- **NB-07-T03 (integration):** Saved time blocks validate ordering/dates/ownership and survive reload without changing task deadlines.
- **NB-07-T04 (component):** Complete/undo/reschedule reflects immediately across Today and Tasks, including error rollback.
- **NB-07-T05 (component):** All focus candidates remain reachable beyond page one and earlier missed days remain discoverable.
- **NB-07-T06 (e2e):** A signed-in user lands on Today, selects an undated growth action and starts Focus directly.

### Locations and fixtures

Place each case in its matching module/type directory:
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/planner/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/planner/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/planner/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/planner/`

Use fixed clocks where time matters, deterministic IDs and authenticated test-user fixtures. Integration tests use an explicitly disposable PostgreSQL database and enforce owner separation. External AI/storage/metadata responses are mocked unless a separately authorized live verification is recorded. Component tests use roles/labels and stable entity-boundary IDs. Browser tests use real local app/API behavior and do not bypass product authentication.

### Red/green protocol

After explicit approval and task-ledger activation, write the named tests first. Confirm the expected behavioral failure before changing implementation. Distinguish tooling/network/database failures from a red assertion. Preserve legacy assertions, implement, rerun targeted tests, refactor while green, then run the full relevant suites and static/build gates. Existing behavior tests that pass initially remain valid; do not manufacture failure.

### Evidence and completion

Record actual commands, baseline SHA, red reason, green results, environment and limitations in the new task-ledger section. Logs belong to `/Users/pranav/Pranav_projects/github/no-brainy/evidences/planner/today-and-capacity/` only after ignore verification. Screenshots are opt-in and disabled by default. No review report is authorized by this test plan.

Final results: PENDING — no tests have run for this task.

---

## Approval — 2026-10-16

The owner’s conversation message “approved.” approves the parent package, this section’s linked task plan, and the six developer packages listed in NB-02. The proposed section above is retained as the pre-approval record. Tests have not run at this approval checkpoint.

---

## NB-07 execution — 2026-10-16

Behavioral red → green for capacity accounting, invalid dates, owner/active selection, scheduling without deadline mutation, stale-save conflicts, all-earlier unfinished work, paginated undated selection and deliberate carry-forward. Browser journey covers outcome, capacity, priority selection beyond page one, time-block create/edit/delete, reload persistence, completion/undo and Focus entry. Full results: 23 governance + 69 unit/component, 21 integration, 8 browser tests passed; types/format/schema/build passed. Four inherited image lint warnings remain assigned to NB-12. Evidence: /Users/pranav/Pranav_projects/github/no-brainy/evidences/planner/today-and-capacity/.
