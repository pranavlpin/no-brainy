# Inbox task ledger

## NB-06 — Recoverable capture and intentional processing

- Date: 2026-10-16 (Asia/Kolkata).
- Branch: `feature/inbox-capture-and-process`.
- Target/base: `feature/projects-outcomes-and-routines`, `089baee9904840cb70ac5157e7c7ad95809797ed`.
- Approved plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/inbox/capture-and-process.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/inbox/capture-and-process.md).
- Approval: Owner's 2026-10-16 “approved.” covering the written package. Packages/local PostgreSQL/full access separately authorized.
- Status: IMPLEMENTED AND VERIFIED locally; global zero-warning gate remains open for the four inherited NB-12 image warnings. Entry was recorded before tests/implementation.
- Scope: Raw text/link capture, user-scoped durable drafts, transactional retry-safe processing to task/note/bookmark/project action, someday/archive, preserved source/result links and safe undo of status. Capture remains available during Focus.
- Routine decisions: Capture is the default; task/note shortcuts use the same durable capture and conversion pipeline. Undo reopens the capture and preserves its destination; reprocessing returns the existing destination, preventing duplicates. Archive never deletes source or destination. Existing Stash content remains accessible.
- Results: Behavior red confirmed for durable drafts, unclassified capture/retry, missing Inbox processing, conversion endpoints, source backlink selection and capture during Focus. An additional browser regression reproduced Space in the dialog pausing the underlying timer; focused-dialog guards fix it. Storage-failure messaging remains accurate after reopen. Dropdown labels are explicitly associated outside option content.
- Data: Additive migration `202610160002_capture_inbox` applied to development and isolated test PostgreSQL. Capture uniqueness is scoped by owner/request UUID; conversion serializes through a row lock and commits the destination/link together. Original text/source remains after processing, archive and undo. No Stash or existing records were moved/deleted.
- Verified: `npm test` (23 Node + 64 Vitest tests), `npm run test:integration` (18), `npm run typecheck`, formatter check, Prisma validation/generation and production build. The full browser run passed six journeys and exposed one dropdown-label defect; after correcting label associations, both affected Inbox journeys passed, covering all seven journeys across the full/targeted runs. The final affected component rerun also passed (4 tests). Four inherited image lint warnings remain assigned to NB-12; durable focus-session persistence is NB-08.
- Evidence: `/Users/pranav/Pranav_projects/github/no-brainy/evidences/inbox/capture-and-process/` (ignored). Screenshots/video/traces, packages, remote operations and review were not requested/performed.
