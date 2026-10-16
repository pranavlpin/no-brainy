# Projects task ledger

## NB-05 — Outcomes, planning metadata and routines

- Date: 2026-10-16 (Asia/Kolkata).
- Branch: `feature/projects-outcomes-and-routines`.
- Target/base: `feature/design-personal-workspace`, `e96b1e56dd4db5493af490025a5f69abbd80a615`.
- Approved plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/projects/outcomes-and-routines.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/projects/outcomes-and-routines.md).
- Approval: Owner's 2026-10-16 “approved.” covering the written rebuild package.
- Status: IMPLEMENTED AND VERIFIED locally; global zero-warning gate remains open for four inherited NB-12 image warnings. Entry was recorded before tests or implementation.
- Scope: Owned projects/outcomes/next actions, optional task planning metadata, goal/note links, recurrence with atomic unique occurrences, additive migration and history.
- Routine decisions: Existing tasks remain unclassified when context is absent. Planned dates never alter deadlines. Month-end recurrence preserves the original day anchor. Completing a missed occurrence produces only the next future scheduled occurrence. Pause and skip are explicit; unsupported rules remain visible and do not generate dates.
- Results: Behavior red confirmed for stripped planning metadata, recurrence calculation, unsupported rule editing, context filtering, project endpoints, routine controls, atomic next actions and the missing project UI. Compile-only stubs were used only to reach meaningful failing assertions for new modules.
- Green: `npm test` (23 Node and 58 Vitest tests), `npm run test:integration` (13), `npm run test:e2e` (5), Prisma validation, `npm run typecheck`, `npm run format:check`, `npm run build` and `git diff --check`. ESLint has zero errors and the same four inherited image warnings assigned to NB-12; the global zero-warning gate remains open.
- Database: Migration `202610160001_projects_routines` applied to development and isolated test databases. A real task created before migration retained its title/owner and nullable defaults after migration. No reset or destructive migration.
- Delivery: Project outcome/context/status, next-action selection and retry-safe creation, supporting notes, archive/restore and task history; independent planned dates/deadlines, estimates/effort, optional project/goal/context; daily/weekly/monthly recurrence with original month anchor, completed history, unique occurrences and pause/resume/skip. Unsupported legacy rules stay visible/editable and do not generate occurrences.
- Browser correction: Colon-separated action IDs were percent-encoded by routing and produced 404s. Opaque deterministic hexadecimal IDs preserve idempotency and work through the existing detail/link routes. The original browser assertions pass.
- Evidence: `/Users/pranav/Pranav_projects/github/no-brainy/evidences/projects/outcomes-and-routines/` (ignored). Initial fixture tooling failure and temporary diagnostic-hook error are infrastructure failures, separately recorded; neither counts as TDD red.
- Follow-through: Goal selector collection paging is owned by the upcoming approved NB-09 growth task. Screenshots, remote operations and review were not requested or performed.
