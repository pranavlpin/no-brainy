# Planner task ledger

## NB-07 — Today, capacity and deliberate scheduling

- Date: 2026-10-16 (Asia/Kolkata).
- Branch: `feature/planner-today-and-capacity`.
- Target/base: `feature/inbox-capture-and-process`, `b5e8cf8b0f119507c092ef33c5be3a53b3615b0b`.
- Approved plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/planner/today-and-capacity.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/planner/today-and-capacity.md).
- Approval: Owner's 2026-10-16 “approved.” covering the written package.
- Status: COMPLETE locally — implementation and verification finished; not pushed or merged.
- Scope: Intentional Today with one outcome/up to three focus tasks, optional growth action, capacity/buffer/window, editable time blocks, all-active task selection, direct Focus and explicit handling of earlier unfinished work. Keep legacy planner routes available and deadlines independent.
- Routine decisions: Default capacity is editable, not a personal recommendation. Unknown estimates stay visible. Time blocks warn on overlaps rather than reject them; invalid intervals are rejected. Scheduled work counts a linked task once using the larger of its block duration or estimate, with other blocks and buffer added separately. A smaller day changes capacity only. Drafts are owner/date scoped with versioned saving; the viewed date stays fixed while editing.
- Results: Behavioral red confirmed for capacity/date validation, owned active selection, planned-date persistence and picker/unfinished interactions; green: 23 governance + 69 unit/component tests, 21 integration tests and all 8 browser journeys. TypeScript, formatting, Prisma validation/generation, additive migrations on development/test databases and production build passed. ESLint has zero errors and the same four inherited image warnings assigned to NB-12.
- Persistence decisions: New priority/growth/block selections explicitly schedule active tasks and append scheduling history without changing deadlines. Already-selected completed work remains visible as progress. The viewed day is fixed while editing and uses versioned autosave.
- Evidence: /Users/pranav/Pranav_projects/github/no-brainy/evidences/planner/today-and-capacity/.
