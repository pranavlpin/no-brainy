# Growth test-plan ledger

Append-only after a section lands on its recorded target branch. This section is a proposed test plan, not an executed test result.

## NB-09 — Growth through practice and evidence, proposed 2026-10-16

Plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/growth/practice-and-evidence.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/growth/practice-and-evidence.md>)
Approval: Pending. Automated tests: Not written. Results: Not run.

### Coverage and acceptance

- **NB-09-T01 (unit):** Task completion percentage and outcome measurement are separate; missing measurement is displayed as unknown.
- **NB-09-T02 (integration):** Adding/removing a linked task does not falsely mark an outcome achieved or erase evidence.
- **NB-09-T03 (integration):** Practice counts deduplicate linked task/session evidence and respect the selected week/timezone.
- **NB-09-T04 (component):** A goal creates and displays its next action immediately; pausing preserves evidence and suppresses nudges.
- **NB-09-T05 (component):** A book application becomes a sourced action without requiring an AI key.
- **NB-09-T06 (e2e):** Create a growth goal, schedule a practice action, finish a session and add evidence that survives reload.

### Locations and fixtures

Place each case in its matching module/type directory:
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/growth/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/growth/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/growth/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/growth/`

Use fixed clocks where time matters, deterministic IDs and authenticated test-user fixtures. Integration tests use an explicitly disposable PostgreSQL database and enforce owner separation. External AI/storage/metadata responses are mocked unless a separately authorized live verification is recorded. Component tests use roles/labels and stable entity-boundary IDs. Browser tests use real local app/API behavior and do not bypass product authentication.

### Red/green protocol

After explicit approval and task-ledger activation, write the named tests first. Confirm the expected behavioral failure before changing implementation. Distinguish tooling/network/database failures from a red assertion. Preserve legacy assertions, implement, rerun targeted tests, refactor while green, then run the full relevant suites and static/build gates. Existing behavior tests that pass initially remain valid; do not manufacture failure.

### Evidence and completion

Record actual commands, baseline SHA, red reason, green results, environment and limitations in the new task-ledger section. Logs belong to `/Users/pranav/Pranav_projects/github/no-brainy/evidences/growth/practice-and-evidence/` only after ignore verification. Screenshots are opt-in and disabled by default. No review report is authorized by this test plan.

Final results: PENDING — no tests have run for this task.

---

## Approval — 2026-10-16

The owner’s conversation message “approved.” approves the parent package, this section’s linked task plan, and the six developer packages listed in NB-02. The proposed section above is retained as the pre-approval record. Tests have not run at this approval checkpoint.

---

## NB-09 execution — 2026-10-16

Behavioral red → green for outcome/measurement separation, date/timezone practice identity, evidence ownership/corrections and retry-safe creation, sourced scheduled experiments, all-page goal selectors and editable success criteria. Additional regressions prevent moving a session's practice date through later evidence and keep linked historical notes visible when changing the selected week. Financial amount semantics remain separate and tested.

Component coverage verifies source-preserving book experiments without AI, explicit Today scheduling, failed evidence input retention and repeated-request identity. The end-to-end Growth journey covers goal creation, an explicitly planned next action, Focus completion, unchanged unknown outcome until evidence is recorded, reload persistence, pausing and narrow-screen layout. The first implementation browser run encountered JSX syntax errors; these were corrected before a clean run. The separate book journey initially used the wrong legacy HTTP verb in its fixture; it now uses the existing PATCH contract without changing assertions.

Latest full results: 23 governance + 84 unit/component tests and 27 integration tests passed. TypeScript, formatting, Prisma validation and the production build passed. ESLint has zero errors and the four inherited image warnings assigned to NB-12. Final browser results are recorded in the task ledger. Evidence: /Users/pranav/Pranav_projects/github/no-brainy/evidences/growth/practice-and-evidence/.

### Final browser result

All 11 browser journeys passed in the integrated run, including the book application → sourced scheduled action journey and Growth at 375px. No screenshots, videos or traces were captured.
