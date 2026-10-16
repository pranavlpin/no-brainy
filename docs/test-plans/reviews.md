# Reviews test-plan ledger

Append-only after a section lands on its recorded target branch. This section is a proposed test plan, not an executed test result.

## NB-10 — Daily shutdown and weekly adjustment, proposed 2026-10-16

Plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/reviews/reflection-to-action.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/reviews/reflection-to-action.md>)
Approval: Pending. Automated tests: Not written. Results: Not run.

### Coverage and acceptance

- **NB-10-T01 (unit):** Daily/weekly ranges respect Asia/Kolkata and exclude out-of-range activity.
- **NB-10-T02 (integration):** Saving a reflection plus tomorrow action is consistent and retry-safe; historical text survives migration.
- **NB-10-T03 (component):** Optional mood/questions can be skipped and a failed save retains all responses.
- **NB-10-T04 (component):** Rescheduling from shutdown changes planned day only and shows the result in Today.
- **NB-10-T05 (integration):** Paused routines and quiet-hour preferences suppress the relevant optional nudges.
- **NB-10-T06 (e2e):** Finish a daily review, reload it, complete a weekly adjustment and see the chosen next action on the intended day.

### Locations and fixtures

Place each case in its matching module/type directory:
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/reviews/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/reviews/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/reviews/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/reviews/`

Use fixed clocks where time matters, deterministic IDs and authenticated test-user fixtures. Integration tests use an explicitly disposable PostgreSQL database and enforce owner separation. External AI/storage/metadata responses are mocked unless a separately authorized live verification is recorded. Component tests use roles/labels and stable entity-boundary IDs. Browser tests use real local app/API behavior and do not bypass product authentication.

### Red/green protocol

After explicit approval and task-ledger activation, write the named tests first. Confirm the expected behavioral failure before changing implementation. Distinguish tooling/network/database failures from a red assertion. Preserve legacy assertions, implement, rerun targeted tests, refactor while green, then run the full relevant suites and static/build gates. Existing behavior tests that pass initially remain valid; do not manufacture failure.

### Evidence and completion

Record actual commands, baseline SHA, red reason, green results, environment and limitations in the new task-ledger section. Logs belong to `/Users/pranav/Pranav_projects/github/no-brainy/evidences/reviews/reflection-to-action/` only after ignore verification. Screenshots are opt-in and disabled by default. No review report is authorized by this test plan.

Final results: PENDING — no tests have run for this task.

---

## Approval — 2026-10-16

The owner’s conversation message “approved.” approves the parent package, this section’s linked task plan, and the six developer packages listed in NB-02. The proposed section above is retained as the pre-approval record. Tests have not run at this approval checkpoint.
