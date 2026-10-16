# Ai test-plan ledger

Append-only after a section lands on its recorded target branch. This section is a proposed test plan, not an executed test result.

## NB-11 — Optional contextual AI with accurate evidence, proposed 2026-10-16

Plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/ai/contextual-assistance.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/ai/contextual-assistance.md>)
Approval: Pending. Automated tests: Not written. Results: Not run.

### Coverage and acceptance

- **NB-11-T01 (unit):** Aggregation excludes records beyond either range boundary and filters cancelled overdue tasks.
- **NB-11-T02 (unit):** Suggestion validation rejects more than three, duplicate, absent or foreign task IDs.
- **NB-11-T03 (integration):** Mocked malformed/failed AI responses become actionable errors without saving partial changes.
- **NB-11-T04 (component):** Accept/edit/dismiss preview works and core planning remains available with no AI key.
- **NB-11-T05 (component):** Every suggested task resolves to its actual title and source; missing evidence is not invented.
- **NB-11-T06 (integration):** Private keys remain server-only and absent from response/log fixtures.

### Locations and fixtures

Place each case in its matching module/type directory:
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/ai/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/ai/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/ai/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/ai/`

Use fixed clocks where time matters, deterministic IDs and authenticated test-user fixtures. Integration tests use an explicitly disposable PostgreSQL database and enforce owner separation. External AI/storage/metadata responses are mocked unless a separately authorized live verification is recorded. Component tests use roles/labels and stable entity-boundary IDs. Browser tests use real local app/API behavior and do not bypass product authentication.

### Red/green protocol

After explicit approval and task-ledger activation, write the named tests first. Confirm the expected behavioral failure before changing implementation. Distinguish tooling/network/database failures from a red assertion. Preserve legacy assertions, implement, rerun targeted tests, refactor while green, then run the full relevant suites and static/build gates. Existing behavior tests that pass initially remain valid; do not manufacture failure.

### Evidence and completion

Record actual commands, baseline SHA, red reason, green results, environment and limitations in the new task-ledger section. Logs belong to `/Users/pranav/Pranav_projects/github/no-brainy/evidences/ai/contextual-assistance/` only after ignore verification. Screenshots are opt-in and disabled by default. No review report is authorized by this test plan.

Final results: PENDING — no tests have run for this task.

---

## Approval — 2026-10-16

The owner’s conversation message “approved.” approves the parent package, this section’s linked task plan, and the six developer packages listed in NB-02. The proposed section above is retained as the pre-approval record. Tests have not run at this approval checkpoint.
