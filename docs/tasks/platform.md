# platform — task ledger

Append-only ledger for the `platform` module (shell, design system, motion, dates, governance). See `CLAUDE.md` §2 and §2a. Never edit or delete an existing entry; add a successor entry instead.

## Owner rulings

### 2026-10-16 — Uninterrupted build batch (T01–T12)

The owner instructed in conversation on 2026-10-16: "Can you build this, without stopping. I want to test and use the final product. Make decisions wherever necessary for me, for my well being and growth." The owner also asked that TDD be used, that all tasks and plans be registered, and that this repository adopt the workflow in `CLAUDE.md`.

Ruling recorded for the batch T01–T12 only:

- **Plan approval** is pre-approved by the owner for every plan registered in this batch. Each plan still records its decisions, open questions, and the ruling applied to each.
- **Dependency changes** are pre-approved for this batch. Each dependency change lands in its own commit.
- **Branching**: all batch tasks land on one integration branch, `feature/platform-daily-loop-overhaul`, as one commit series per task, with one PR at the end. Merge remains gated on owner review.
- **Push and PR creation** are authorized once the batch is complete. No merge.
- Any task outside this batch returns to the strict per-task approval flow in `CLAUDE.md` §7.

## Tasks

| ID | Task | Date | Branch | Plan | Status |
|---|---|---|---|---|---|
| T01 | Governance, test layout, formatting gates | 2026-10-16 | feature/platform-daily-loop-overhaul | [plan](../plans/platform/governance-and-test-layout.md) | done — 4 files / 19 tests green, typecheck clean, lint at 5 pre-existing warnings |
| T02 | Motion system and design system v2 | 2026-10-16 | feature/platform-daily-loop-overhaul | [plan](../plans/platform/motion-and-design-system-v2.md) | in progress |
| T03 | User-timezone day boundaries | 2026-10-16 | feature/platform-daily-loop-overhaul | [plan](../plans/platform/user-timezone-dates.md) | planned |

## Backlog (registered, not yet planned)

These are owner-visible next bets. They have no plan yet and must go through the full workflow before any code is written.

- Guided weekly review with AI theme detection across the week's reflections (module `reviews`).
- Learning Journeys module replacing the static pages under `public/secret/learning/` (new module `journeys`).
- Merge Bookmarks into Stash link messages (modules `bookmarks`, `stash`).
