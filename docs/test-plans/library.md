# Library test-plan ledger

Append-only after a section lands on its recorded target branch. This section is a proposed test plan, not an executed test result.

## NB-12 — Preserve and integrate Library and Life modules, proposed 2026-10-16

Plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/library/preserve-and-integrate.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/library/preserve-and-integrate.md>)
Approval: Pending. Automated tests: Not written. Results: Not run.

### Coverage and acceptance

- **NB-12-T01 (component):** Note editing/rendering, wiki-link navigation and save/error status continue to work under the new shell.
- **NB-12-T02 (integration):** Flashcard review schedules and quiz results remain correct after shared UI changes.
- **NB-12-T03 (integration):** Expense preview/import preserves INR decimals and duplicate handling; foreign categories are rejected.
- **NB-12-T04 (component):** Stash encrypted messages/file failures remain correctly represented; changing navigation does not expose sensitive content.
- **NB-12-T05 (e2e):** Library and Life destinations, including Flashcards, are reachable on desktop and narrow viewports.
- **NB-12-T06 (e2e):** A cross-module journey from book application to task, focus and reflection preserves source links.

### Locations and fixtures

Place each case in its matching module/type directory:
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/library/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/library/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/library/`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/library/`

Use fixed clocks where time matters, deterministic IDs and authenticated test-user fixtures. Integration tests use an explicitly disposable PostgreSQL database and enforce owner separation. External AI/storage/metadata responses are mocked unless a separately authorized live verification is recorded. Component tests use roles/labels and stable entity-boundary IDs. Browser tests use real local app/API behavior and do not bypass product authentication.

### Red/green protocol

After explicit approval and task-ledger activation, write the named tests first. Confirm the expected behavioral failure before changing implementation. Distinguish tooling/network/database failures from a red assertion. Preserve legacy assertions, implement, rerun targeted tests, refactor while green, then run the full relevant suites and static/build gates. Existing behavior tests that pass initially remain valid; do not manufacture failure.

### Evidence and completion

Record actual commands, baseline SHA, red reason, green results, environment and limitations in the new task-ledger section. Logs belong to `/Users/pranav/Pranav_projects/github/no-brainy/evidences/library/preserve-and-integrate/` only after ignore verification. Screenshots are opt-in and disabled by default. No review report is authorized by this test plan.

Final results: PENDING — no tests have run for this task.

---

## Approval — 2026-10-16

The owner’s conversation message “approved.” approves the parent package, this section’s linked task plan, and the six developer packages listed in NB-02. The proposed section above is retained as the pre-approval record. Tests have not run at this approval checkpoint.

---

## NB-12 execution — 2026-10-16

Completed all six acceptance areas. Behavioral failures and fixture corrections are recorded at /Users/pranav/Pranav_projects/github/no-brainy/docs/tasks/library.md. Final gates: 23 Node, 111 Vitest, 54 database integration, and 14 Chromium browser tests passed; strict TypeScript, zero-warning ESLint, formatting, Prisma validation and production build passed. Evidence: /Users/pranav/Pranav_projects/github/no-brainy/evidences/library/preserve-and-integrate/. External providers mocked/unconfigured; screenshots disabled. Existing assertions retained.
