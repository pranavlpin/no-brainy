# Focus test-plan ledger

Append-only after a section lands on its recorded target branch. This section is a proposed test plan, not an executed test result.

## NB-08 — Durable focus sessions, interruptions and results, proposed 2026-10-16

Plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/focus/durable-sessions.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/focus/durable-sessions.md>)
Approval: Pending. Automated tests: Not written. Results: Not run.

### Coverage and acceptance

- **NB-08-T01 (unit):** Fake-clock tests cover work/pause/resume/finish, tab suspension and elapsed-time derivation.
- **NB-08-T02 (unit):** Refresh recovery does not count paused time or reset elapsed work; custom durations validate bounds.
- **NB-08-T03 (integration):** Duplicate finish/start requests and concurrent tabs cannot create duplicate active sessions or outcomes.
- **NB-08-T04 (component):** Leaving full-screen mode preserves the compact timer and draft intention.
- **NB-08-T05 (component):** Capturing a thought or reading a linked note does not trigger timer shortcuts or lose task context.
- **NB-08-T06 (e2e):** Start, pause, reload, resume and record Made progress; task stays active and review receives the session once.

### Locations and fixtures

Place each case in its matching module/type directory:
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/focus/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/focus/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/focus/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/focus/`

Use fixed clocks where time matters, deterministic IDs and authenticated test-user fixtures. Integration tests use an explicitly disposable PostgreSQL database and enforce owner separation. External AI/storage/metadata responses are mocked unless a separately authorized live verification is recorded. Component tests use roles/labels and stable entity-boundary IDs. Browser tests use real local app/API behavior and do not bypass product authentication.

### Red/green protocol

After explicit approval and task-ledger activation, write the named tests first. Confirm the expected behavioral failure before changing implementation. Distinguish tooling/network/database failures from a red assertion. Preserve legacy assertions, implement, rerun targeted tests, refactor while green, then run the full relevant suites and static/build gates. Existing behavior tests that pass initially remain valid; do not manufacture failure.

### Evidence and completion

Record actual commands, baseline SHA, red reason, green results, environment and limitations in the new task-ledger section. Logs belong to `/Users/pranav/Pranav_projects/github/no-brainy/evidences/focus/durable-sessions/` only after ignore verification. Screenshots are opt-in and disabled by default. No review report is authorized by this test plan.

Final results: PENDING — no tests have run for this task.

---

## Approval — 2026-10-16

The owner’s conversation message “approved.” approves the parent package, this section’s linked task plan, and the six developer packages listed in NB-02. The proposed section above is retained as the pre-approval record. Tests have not run at this approval checkpoint.

---

## NB-08 execution — 2026-10-16

Behavioral red confirmed for timestamp-derived elapsed work, paused reload recovery, duration validation, concurrent starts/results, and owner-scoped recovery storage. The browser initially failed on the missing session-intention field before UI implementation. Green domain/database slices verify one active owner session, repeat finish idempotency, stale-version rejection, explicit completion, and retained titles after task deletion. Component coverage verifies that Focus leaves the underlying page and its draft mounted and that the compact timer opens the same task.

The first integrated browser pass covered intention retention, 50-minute selection, pause/reload/resume, partial results, and capture during an active timer. An additional lost-response journey commits a result on the server, drops the response, reloads, then retries the stored request. Its first run exposed a test synchronization race while clicking a dialog that correctly closes after server reconciliation; the test now waits for that observed state before leaving Focus.

Unit/component and governance: 76 + 23 passed. Full integration: 23 passed. Types, schema validation, migrations, formatting and production build passed. ESLint has zero errors and four inherited image warnings assigned to NB-12. Final browser recovery result is recorded in the task ledger. Evidence: /Users/pranav/Pranav_projects/github/no-brainy/evidences/focus/durable-sessions/.

### Final integrated result

The full browser run exposed a late authenticated-owner provider remount resetting fast-opened project/task forms. A new component test reproduced the premature editable state; the loading boundary fixed it. A further component red/green test preserves the original task context for a pending lost-response result. Final: 23 governance + 78 unit/component tests; 23 integration; all 9 browser journeys and a final targeted recovery journey passed. Final types/format/schema/build passed; only the four inherited image warnings remain for NB-12.
