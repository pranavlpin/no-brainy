# Product test-plan ledger

Append-only after a section lands on its recorded target branch. This section is a proposed test plan, not an executed test result.

## NB-14 — Integrated product acceptance and usable handoff, proposed 2026-10-16

Plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/final-acceptance.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/final-acceptance.md>)
Approval: Pending. Automated tests: Not written. Results: Not run.

### Coverage and acceptance

- **NB-14-T01 (e2e):** Complete the full daily and weekly journey with reloads and no AI key using real authenticated endpoints.
- **NB-14-T02 (e2e):** A 50-task fixture remains navigable; status, save failures, retries and planner cross-view updates are correct.
- **NB-14-T03 (integration):** Applying all additive migrations preserves populated baseline module records and relations.
- **NB-14-T04 (e2e):** Focus survives pause/reload/tab changes and records exactly one partial/completed result.
- **NB-14-T05 (e2e):** Legacy Library/Life paths and settings work in desktop and mobile layouts.
- **NB-14-T06 (e2e):** First-use setup, local startup and scoped export/restore are usable and truthfully documented.

### Locations and fixtures

Place each case in its matching module/type directory:
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/product/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/product/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/product/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/product/`

Use fixed clocks where time matters, deterministic IDs and authenticated test-user fixtures. Integration tests use an explicitly disposable PostgreSQL database and enforce owner separation. External AI/storage/metadata responses are mocked unless a separately authorized live verification is recorded. Component tests use roles/labels and stable entity-boundary IDs. Browser tests use real local app/API behavior and do not bypass product authentication.

### Red/green protocol

After explicit approval and task-ledger activation, write the named tests first. Confirm the expected behavioral failure before changing implementation. Distinguish tooling/network/database failures from a red assertion. Preserve legacy assertions, implement, rerun targeted tests, refactor while green, then run the full relevant suites and static/build gates. Existing behavior tests that pass initially remain valid; do not manufacture failure.

### Evidence and completion

Record actual commands, baseline SHA, red reason, green results, environment and limitations in the new task-ledger section. Logs belong to `/Users/pranav/Pranav_projects/github/no-brainy/evidences/product/final-acceptance/` only after ignore verification. Screenshots are opt-in and disabled by default. No review report is authorized by this test plan.

Final results: PENDING — no tests have run for this task.

---

## Approval — 2026-10-16

The owner’s conversation message “approved.” approves the parent package, this section’s linked task plan, and the six developer packages listed in NB-02. The proposed section above is retained as the pre-approval record. Tests have not run at this approval checkpoint.
