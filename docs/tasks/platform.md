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


### 2026-10-16 — Adoption package approved

The owner approved the review and adoption package in `docs/plans/product/acceptance-branch-adoption.md` with the conversation message "Go". That approves tasks T14–T22 (Tier 1 and Tier 2) to be planned, registered, tested, and implemented in dependency order on the stacked branch `feature/product-adoption-wave-2` (base: `feature/platform-daily-loop-overhaul`). Dependency changes, if any, are pre-approved and land in their own commits. Push and a stacked PR are authorized at the end of the batch; merge stays the owner's call. Ideas and pure logic ported from `test/product-final-acceptance` are credited in each plan.

### 2026-10-17 — End-to-end sweep defects

After the browser end-to-end sweep (report in gitignored `evidences/e2e/full/REPORT.md`) listed thirteen defects, the owner instructed in conversation: "push the current changes and fix all in same branch." Ruling recorded: every defect in that list is a pre-approved bug-fix task (T24–T32), planned, registered, tested first, and committed as one commit per task on the integration branch `feature/product-adoption-wave-2`. Push is authorized; merge stays the owner's call. Defects outside that list return to the strict per-task approval flow.

## Tasks

| ID  | Task                                                                     | Date       | Branch                               | Plan                                                     | Status                                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------ | ---------- | ------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T01 | Governance, test layout, formatting gates                                | 2026-10-16 | feature/platform-daily-loop-overhaul | [plan](../plans/platform/governance-and-test-layout.md)  | done — 4 files / 19 tests green, typecheck clean, lint at 5 pre-existing warnings                                                                                                                                                                                  |
| T02 | Motion system and design system v2                                       | 2026-10-16 | feature/platform-daily-loop-overhaul | [plan](../plans/platform/motion-and-design-system-v2.md) | done — 10 files / 33 tests green, typecheck clean, dev server renders all dashboard routes                                                                                                                                                                         |
| T03 | User-timezone day boundaries                                             | 2026-10-16 | feature/platform-daily-loop-overhaul | [plan](../plans/platform/user-timezone-dates.md)         | done — 13 files / 48 tests green; tests pinned to TZ=UTC; planner, reviews, notifications, AI routes use user zone                                                                                                                                                 |
| T13 | Bug fix: head hydration failure, missing favicon, client-state hydration | 2026-10-16 | feature/platform-daily-loop-overhaul | [plan](../plans/platform/hydration-head-and-favicon.md)  | fixed — root cause: an empty GA id rendered a stray text node inside the manual head, so every page failed hydration; GA moved to a null-safe component in body, favicon.ico added, localStorage-backed stores now hydrate after mount; 43 files / 141 tests green |
| T21 | Core backup export / import, personal setup defaults, reminder quiet hours | 2026-10-16 | feature/product-adoption-wave-2 | [plan](../plans/platform/backup-setup-quiet-hours.md) | done — 71 files / 224 tests green; migration add_core_import_receipts; versioned export, preview, additive import with receipts; personal defaults seed new plans; quiet hours and reminder time honoured by nudges |
| T22 | Workspace states, typography pass, Work / Personal context filter | 2026-10-16 | feature/product-adoption-wave-2 | [plan](../plans/platform/workspace-states-and-context.md) | done — 74 files / 228 tests green; PageHeader / Loading / Error / Empty primitives with eyebrow and display title; Work / Personal context switch persisted and applied to tasks, projects, Today |
| T29 | Bug fix: dark mode hydrates after mount; one app icon | 2026-10-17 | feature/product-adoption-wave-2 | [plan](../plans/platform/dark-mode-hydration-and-app-icon.md) | fixed — root cause: the dark-mode store read localStorage at module init, and public/icon.svg duplicated the metadata route. Store hydrates after mount behind a pre-paint script; metadata route removed; 91 files / 254 tests green |

## Backlog (registered, not yet planned)

These are owner-visible next bets. They have no plan yet and must go through the full workflow before any code is written.

- Guided weekly review with AI theme detection across the week's reflections (module `reviews`).
- Learning Journeys module replacing the static pages under `public/secret/learning/` (new module `journeys`).
- Merge Bookmarks into Stash link messages (modules `bookmarks`, `stash`).

## Batch summary — 2026-10-16

All twelve registered tasks (T01–T12) landed on `feature/platform-daily-loop-overhaul` as one commit series per task, each with a plan, failing-first tests, and a ledger status line. Final gates on the branch: `pnpm typecheck` clean, `pnpm lint` at the five pre-existing warnings, `pnpm test` 40 files / 135 tests green, `pnpm build` succeeds for every route. Local verification used the dev server with the owner account: planner triage, review-to-plan intent handoff, home aggregate, focus sessions, nav badges, manifest, and the cron endpoint were exercised end to end over HTTP. Visual QA in a browser is the owner's step; no screenshots were requested.
