# Integrated product acceptance ledger

## NB-14 — Final acceptance and local handoff

- Date: 2026-10-16 (Asia/Kolkata).
- Branch: `test/product-final-acceptance`.
- Target/base: `feature/data-personal-setup-and-backup`, `cbb889865554cdf81278d8df91a68ca663e2da54`.
- Plan: /Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/final-acceptance.md. Test plan: /Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/product.md.
- Approval: Owner's 2026-10-16 “approved.” covers this written final acceptance plan. Local installs/PostgreSQL/full access are authorized. Existing module plans/ledgers remain immutable.
- Status: IN PROGRESS — registered before tests/implementation.
- Scope: Full manual product journey without an AI key, 50-task navigation and persistence, 360/768/1440 px and keyboard/reduced-motion checks, populated baseline migration upgrade, all static/test/build gates, verified persistent local server and first-use handoff. Existing Focus recovery, backup, Library and owner-separation regressions remain in the full suite.
- Decisions: Migration upgrade uses a uniquely named temporary schema inside the confirmed disposable test database, applying baseline SQL, inserting representative linked legacy records, then applying all seven approved additive migrations. Drop only that exact temporary schema in cleanup; never reset the normal app or test schema. Browser test fixtures use normal registration and authenticated APIs. Existing behavior may pass initially; no artificial red failure is required for acceptance tests. Any genuine defect receives a failing regression before a scoped fix.
- Verification: Pending. Evidence directory: /Users/pranav/Pranav_projects/github/no-brainy/evidences/product/final-acceptance/ (Git ignore verified). No review, remote operation, deployment or screenshot is authorized.

### Acceptance progress

- Populated migration upgrade passed initially: original notes/wiki links, tasks/subtasks/goals, task links, book applications, deck/card scheduling, day-plan blocks, daily reflection/statistics, exact finance decimals/category relations, bookmarks, watchlist and encrypted Stash payloads survived all seven new migrations. Temporary schemas were removed after the check.
- The new 50-task journey passed after correcting test orchestration: wait for capture processing confirmation before navigating, use the available creation-date sort, and intercept the task editor's actual PUT method for the simulated outage. These were test-harness corrections, not product failures. It verified retained drafts/retry, pagination, project/goal relations, Today reload, partial Focus result, growth evidence and daily/weekly reflection without an AI key.
- Responsive checks passed at 360, 768 and 1440 pixels across primary routes, with keyboard capture, dark/light appearance and reduced motion. No screenshot or performance score was produced.
- Production handoff runs the packaged standalone server with its static assets at http://localhost:3000. Normal app database connectivity and all 18 applied migrations are verified. Login/registration return 200; an unauthenticated task API returns 401. A separate production browser check found no failed resources or uncaught page errors and verified private-route redirection. No normal-app test/demo account was inserted.
- The first startup used the generic Next start command, which reported the repository's standalone configuration. The handoff now uses the generated standalone server; README startup instructions were corrected accordingly. Its process record is /Users/pranav/Pranav_projects/github/no-brainy/evidences/product/final-acceptance/app-server.pid; log is /Users/pranav/Pranav_projects/github/no-brainy/evidences/product/final-acceptance/app-server.log.
