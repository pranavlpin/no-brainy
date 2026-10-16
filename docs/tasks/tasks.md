# Tasks task ledger

## NB-03 — Task discovery, dates and reliable saves

- Date: 2026-10-16 (Asia/Kolkata).
- Branch: `bugfix/tasks-persistence-and-discovery`.
- Target/base: `test/platform-react-tdd-foundation`, `ccdd305b51c4c834ff9e1f7f249195c44a5dc439`.
- Approved plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/tasks/persistence-and-discovery.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/tasks/persistence-and-discovery.md).
- Approval: Owner's 2026-10-16 “approved.” message covering the complete rebuild package.
- Status: IMPLEMENTED — unit/component/database/build verification passed; browser acceptance remains open for the NB-04 shared-layout fix.
- Scope: Active tasks/pagination/order, compatible calendar dates, recoverable serialized saves, cross-module cache updates and ownership.
- Inherited gate: One notes-list hook warning is addressed within this reliability work; four image warnings remain assigned to NB-12.
- Results: Confirmed behavioral red for date-only input, multi-status pagination, cross-owner relations, stale saves, merged task edits, navigation draft recovery, remount save races, optimistic planner feedback, list controls, duplicate Enter, and non-server timezone. Implemented fixes after each red slice.
- Green: `npm test` (23 Node + 38 Vitest tests), `npm run test:integration` (6 tests), `npm run typecheck`, `npm run format:check`, `npm run build`, and `git diff --check`.
- Lint: zero errors; notes-list dependency warning fixed; four inherited image warnings remain assigned to NB-12. Zero-warning global gate is still open.
- Browser: new real-registration/task/note persistence journey executed and exposed a pre-existing root-head hydration mismatch followed by removeChild navigation failures. No assertions were removed. NB-04 owns root layout/font/navigation work; retain this browser test and rerun it after that fix. This task is not marked fully verified yet.
- Implementation choices: calendar labels retain the date portion of legacy ISO values; explicit priority rank sorts matching personal-workspace tasks before pagination; optional version checks retain legacy API compatibility while both detail editors send expected versions. Saves serialize per user/entity, persist drafts before debounce, flush on navigation, and require a choice on remote conflict.
- Evidence: `/Users/pranav/Pranav_projects/github/no-brainy/evidences/tasks/persistence-and-discovery/` (ignored).
- No dependency, schema, remote Git, deployment or review action.
