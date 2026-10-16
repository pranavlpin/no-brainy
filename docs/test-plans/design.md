# Design test-plan ledger

Append-only after a section lands on its recorded target branch. This section is a proposed test plan, not an executed test result.

## NB-04 — Full personal workspace design system and navigation, proposed 2026-10-16

Plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/design/personal-workspace.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/design/personal-workspace.md>)
Approval: Pending. Automated tests: Not written. Results: Not run.

### Coverage and acceptance

- **NB-04-T01 (component):** Dialog opens at the correct focus target, contains Tab navigation, closes with Escape and restores focus.
- **NB-04-T02 (component):** Saved navigation/theme preferences migrate without losing access to existing modules, including Flashcards.
- **NB-04-T03 (component):** Capture and essential navigation are reachable without hover on a narrow touch layout.
- **NB-04-T04 (e2e):** All primary/legacy destinations resolve without route collisions or unauthorized content exposure.
- **NB-04-T05 (e2e):** Dark/light/reduced-motion settings persist after reload; layout has no document-wide horizontal overflow at the specified widths.

### Locations and fixtures

Place each case in its matching module/type directory:
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/design/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/design/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/design/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/design/`

Use fixed clocks where time matters, deterministic IDs and authenticated test-user fixtures. Integration tests use an explicitly disposable PostgreSQL database and enforce owner separation. External AI/storage/metadata responses are mocked unless a separately authorized live verification is recorded. Component tests use roles/labels and stable entity-boundary IDs. Browser tests use real local app/API behavior and do not bypass product authentication.

### Red/green protocol

After explicit approval and task-ledger activation, write the named tests first. Confirm the expected behavioral failure before changing implementation. Distinguish tooling/network/database failures from a red assertion. Preserve legacy assertions, implement, rerun targeted tests, refactor while green, then run the full relevant suites and static/build gates. Existing behavior tests that pass initially remain valid; do not manufacture failure.

### Evidence and completion

Record actual commands, baseline SHA, red reason, green results, environment and limitations in the new task-ledger section. Logs belong to `/Users/pranav/Pranav_projects/github/no-brainy/evidences/design/personal-workspace/` only after ignore verification. Screenshots are opt-in and disabled by default. No review report is authorized by this test plan.

Final results: PENDING — no tests have run for this task.

---

## Approval — 2026-10-16

The owner’s conversation message “approved.” approves the parent package, this section’s linked task plan, and the six developer packages listed in NB-02. The proposed section above is retained as the pre-approval record. Tests have not run at this approval checkpoint.
