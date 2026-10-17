# Review of `test/product-final-acceptance` and proposed adoption package

**Module:** product · **Date:** 2026-10-16 · **Branch under review:** `origin/test/product-final-acceptance` (33 commits, 383 files, +25,792 / −7,456 against `main` at `01845cf`) · **Reviewer's branch:** `feature/platform-daily-loop-overhaul` (PR https://github.com/pranavlpin/no-brainy/pull/6) · **Status:** review complete; adoption tasks proposed, NOT approved, no code changed.

## What that branch is

A parallel rebuild from the same `main` baseline, built in the checkout `/Users/pranav/Pranav_projects/github/no-brainy` and served on http://localhost:3111 from a standalone build. It uses its own PostgreSQL cluster on port 55432 (data directory under that checkout's ignored `evidences/` folder) with database `nobrainy`; it does not share the database used by this checkout. Its thesis: Capture → Process inbox → Plan Today → Focus → Reflect → Adjust the week, with primary navigation Today / Inbox / Projects / Growth / Library, a Work / Personal / All context filter, a calm warm-neutral and teal visual system with CSS-only motion, and heavy emphasis on save reliability (serialized drafts, conflicts, idempotent requests) and honest, non-punitive copy.

Schema additions there: `Capture`, `Project`, `ProjectNote`, `TaskPlanEvent`, `FocusSession` (session-centric: intention, state, accumulatedSeconds, outcome, reflection, nextAction, unique active owner), `GrowthEvidence`, `WeeklyReview`, `CoreImportReceipt`; `Task` gains projectId, plannedDate, estimatedMinutes, effort, context, routine fields; `DayPlan` gains mainOutcome, availableMinutes, bufferMinutes, workStart/End, growthTaskId; `DailyReview` gains whatMoved, blockers, tomorrowTaskId, closedAt; `Goal` gains successCriteria, baseline, target, unit, weeklyPracticeTarget.

## Where the two branches overlap

Both arrive at the same spine: Today as the authenticated home, a one-line intent/outcome, three priorities, carry-forward of unfinished work, a close-the-day flow that hands tomorrow its first move, persisted focus sessions, timezone-aware "today", hydration-safe client stores, and quick capture. The owner prefers this branch's visual design (aurora, glass, retro accents, framer-motion), so the visual system there is not adopted; its typographic hierarchy and page-state primitives are.

## Pick list

### Tier 1 — adopt (high value, fits the daily loop)

1. **Planned day separate from deadline, plus capacity.** `Task.plannedDate`, `estimatedMinutes`, `effort`, `context`; `DayPlan.availableMinutes`, `bufferMinutes`, `workStart/End`. Port `src/lib/planner/capacity.ts` (pure: planned vs available, unknown estimates stay unknown, overlap warnings, "make a smaller day"). Today and Planner show a capacity card; triage "move" sets the planned day, never the deadline.
2. **Inbox with processing.** `Capture` model with states inbox / someday / processed / archived, transactional process endpoint keyed by client request id, undo, source backlink. This branch's natural-language capture stays the fast path; a capture that parses to nothing, or Shift+Enter, lands in Inbox. Replaces the earlier "treat Stash as inbox" compromise.
3. **Focus outcomes.** End a session with Completed / Made progress / Blocked plus a result note and optional next action; only Completed finishes the task; sessions appear in the review's activity list and can be cited as growth evidence. Keep this branch's wall-clock timer store and pill.
4. **Weekly review.** `WeeklyReview` keyed by Monday: Stop / Keep / Try, up to three next-week outcomes, next week's first action planned onto Monday. Already in this branch's backlog; the design there is sound.
5. **Serialized draft saving.** Port `src/lib/tasks/draft-save.ts` (version-checked queue, retry, explicit conflict choice, localStorage survival) and the `SaveStatus` component; wire into task detail, note editor, the intent card, and both review editors.
6. **Projects.** Outcome, status, one explicit next action, linked tasks and notes, goal link. This is the layer the owner currently keeps in a hand-written HTML tracker.
7. **Growth evidence and practice.** Success criteria, optional baseline / target / unit, weekly practice target, dated evidence with sources (note, book, project, session), rest and skip recorded without penalty, "turn a book application into an experiment". Integrates with this branch's stale-goal detection and Home goals pulse.
8. **Core backup export and additive import.** Versioned JSON, preview before confirm, remapped ids, receipts. On the owner's own TODO list; adopt as designed, extended to this branch's models.

### Tier 2 — adopt (smaller, improves consistency)

9. `PageHeader`, `LoadingState`, `ErrorState`, `EmptyState` primitives and the eyebrow / display-title typography, applied across pages in this branch's visual language.
10. Tasks list fixes: pagination controls with total and page, "Active" includes in-progress, numeric priority ordering, retry on load failure.
11. Reminder quiet hours and a review-reminder time in notification preferences; the cron generator honors them.
12. Work / Personal / All context in the top bar, filtering tasks, projects, and Today.
13. Time blocks: keyboard-first form, overlap and outside-window warnings, linked action, complete/edit/delete.
14. Personal setup: default capacity and working window, default context, focus sound default; folded into this branch's existing Time settings section.
15. Capture allowed from inside focus mode without ending the session.

### Tier 3 — later, own tasks

16. Playwright browser suite with an isolated test database and runner.
17. AI hardening: Zod validation of suggested task ids, both date-range bounds, cancelled tasks excluded from overdue, bounded evidence references, mocked-provider tests.

### Not adopted

- The muted teal / system-font visual system, CSS-only motion, and legacy shadow aliasing (owner prefers this branch's design).
- Flat "Your workspace / Explore & reflect" sidebar and the Dialog-based mobile drawer (this branch has grouped navigation, a bottom bar, and a capture button).
- A `Library` landing route as primary navigation (covered by grouped navigation; revisit if the Learn group grows).

## Merge mechanics and risks

- Direct cherry-picks will not apply: both branches add a `focus_sessions` table with different columns and extend `DayPlan` / `DailyReview` with different field names (`intentMd` vs `mainOutcome`, `tomorrowIntent` vs `tomorrowTaskId`). Adoption means re-implementing on this branch's foundations (date helpers, motion wrappers, optimistic hooks, Radix dialog) while porting the pure logic (capacity, draft-save, recurrence, calendar) and the data-model ideas through new additive migrations.
- Keep `intentMd` as the free-text intent and add `tomorrowTaskId` alongside it, so the owner can hand off either a sentence or a concrete task.
- The port-55432 cluster under the other checkout holds the owner's real local data for that app. Nothing here touches it. If the owner later wants that data in this app, the backup export/import (Tier 1, item 8) is the bridge once the formats are aligned.
- Every adopted item is a new feature and goes through the strict workflow: plan, approval, ledger row, failing tests, implementation. The 2026-10-16 batch ruling covers T01–T13 and defects only; it does not approve this package.

## Proposed task registry (awaiting approval)

| ID  | Task                                                                                                                         | Module   | Depends on         |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------ |
| T14 | Tasks reliability: pagination, active filter, planned date, estimate / effort / context, draft-save on task detail and notes | tasks    | —                  |
| T15 | Capacity and time blocks on Planner and Today                                                                                | planner  | T14                |
| T16 | Inbox: Capture model, processing, undo, capture-modal integration, FAB                                                       | capture  | T14                |
| T17 | Focus outcomes and session intention; review activity view                                                                   | focus    | —                  |
| T18 | Projects with outcome, next action, linked notes                                                                             | projects | T14                |
| T19 | Growth: success criteria, measurements, practice target, evidence, book experiments                                          | goals    | T17, T18           |
| T20 | Weekly review with Stop / Keep / Try and next-week outcomes                                                                  | reviews  | T15, T17           |
| T21 | Core backup export / import, personal setup, reminder quiet hours                                                            | platform | T16, T18, T19, T20 |
| T22 | Workspace states and typography pass; context filter                                                                         | platform | T14                |

Approval of this package approves the nine linked task plans to be written and executed in this order on a stacked branch off `feature/platform-daily-loop-overhaul`, with one PR per wave or one PR at the end as the owner prefers. Push and PR creation would follow the same ruling as the first batch; merge stays the owner's call.

## Outcome (2026-10-16)

All nine tasks landed on `feature/product-adoption-wave-2` (base `feature/platform-daily-loop-overhaul`), one commit per task after a docs commit that registered the package. Final gates on the branch: 74 test files / 228 tests green, `pnpm typecheck` clean, `pnpm lint` at the five pre-existing warnings, `pnpm build` succeeds. Migrations added, in order: `add_task_planning_fields`, `add_day_plan_capacity`, `add_captures`, `add_focus_outcomes`, `add_projects`, `add_growth_evidence`, `add_weekly_reviews`, `add_core_import_receipts`. Each plan carries a Refinements section recording where the implementation departed from the plan; the ledgers hold the done rows. Merge order: PR #6 first, then this stacked PR.
