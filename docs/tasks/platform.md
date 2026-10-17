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

### 2026-10-16 — Acceptance-testing defects

While testing the batch the owner reported browser console errors ("These errors are coming."). Defects found in the batch's own unlanded work are treated as pre-approved bug-fix tasks on the same branch, registered and planned like any other task. This extends the batch ruling to T13 and to further defects the owner reports before the branch lands; it does not cover new features.

## Tasks

| ID  | Task                                                                     | Date       | Branch                               | Plan                                                     | Status                                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------ | ---------- | ------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T01 | Governance, test layout, formatting gates                                | 2026-10-16 | feature/platform-daily-loop-overhaul | [plan](../plans/platform/governance-and-test-layout.md)  | done — 4 files / 19 tests green, typecheck clean, lint at 5 pre-existing warnings                                                                                                                                                                                  |
| T02 | Motion system and design system v2                                       | 2026-10-16 | feature/platform-daily-loop-overhaul | [plan](../plans/platform/motion-and-design-system-v2.md) | done — 10 files / 33 tests green, typecheck clean, dev server renders all dashboard routes                                                                                                                                                                         |
| T03 | User-timezone day boundaries                                             | 2026-10-16 | feature/platform-daily-loop-overhaul | [plan](../plans/platform/user-timezone-dates.md)         | done — 13 files / 48 tests green; tests pinned to TZ=UTC; planner, reviews, notifications, AI routes use user zone                                                                                                                                                 |
| T13 | Bug fix: head hydration failure, missing favicon, client-state hydration | 2026-10-16 | feature/platform-daily-loop-overhaul | [plan](../plans/platform/hydration-head-and-favicon.md)  | fixed — root cause: an empty GA id rendered a stray text node inside the manual head, so every page failed hydration; GA moved to a null-safe component in body, favicon.ico added, localStorage-backed stores now hydrate after mount; 43 files / 141 tests green |

## Backlog (registered, not yet planned)

These are owner-visible next bets. They have no plan yet and must go through the full workflow before any code is written.

- Guided weekly review with AI theme detection across the week's reflections (module `reviews`).
- Learning Journeys module replacing the static pages under `public/secret/learning/` (new module `journeys`).
- Merge Bookmarks into Stash link messages (modules `bookmarks`, `stash`).

## Batch summary — 2026-10-16

All twelve registered tasks (T01–T12) landed on `feature/platform-daily-loop-overhaul` as one commit series per task, each with a plan, failing-first tests, and a ledger status line. Final gates on the branch: `pnpm typecheck` clean, `pnpm lint` at the five pre-existing warnings, `pnpm test` 40 files / 135 tests green, `pnpm build` succeeds for every route. Local verification used the dev server with the owner account: planner triage, review-to-plan intent handoff, home aggregate, focus sessions, nav badges, manifest, and the cron endpoint were exercised end to end over HTTP. Visual QA in a browser is the owner's step; no screenshots were requested.
