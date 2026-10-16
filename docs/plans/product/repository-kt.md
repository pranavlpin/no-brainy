# Repository KT for the personal-growth rebuild

Date: 2026-10-16 (Asia/Kolkata)
Baseline: `01845cfa639f843dfb59f87558acc176338bb4c8`
Status: Knowledge-transfer record; parent implementation package approved on 2026-10-16.
Parent: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md).

## Sources consulted

The README and contribution/security guides were read, and the architecture, behavior, contracts, acceptance criteria, and deployment sections relevant to this rebuild were inspected in the longer specifications. Source code and migrations were cross-checked; historical document claims are not treated as runtime verification.

| Source | Knowledge retained | Rebuild implication |
|---|---|---|
| [/Users/pranav/Pranav_projects/github/no-brainy/README.md](/Users/pranav/Pranav_projects/github/no-brainy/README.md) | Capture/organize/plan/execute/learn/reflect loop; Markdown-first modules; BYOK; finance/media utilities; pnpm/PostgreSQL setup | Preserve functional modules and make the daily loop explicit |
| [/Users/pranav/Pranav_projects/github/no-brainy/docs/MyFocusHub_PRD.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/MyFocusHub_PRD.md) | Low-friction capture, cross-linking, goals, learning/application, optional AI, responsive web before native | Prioritize personal outcomes and usable workflows; do not implement every historical future item |
| [/Users/pranav/Pranav_projects/github/no-brainy/docs/TECHNICAL_SPEC.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/TECHNICAL_SPEC.md) | Next route handlers, Prisma/PostgreSQL, Zod, Zustand + React Query, CodeMirror, module organization; intended Vitest/Testing Library/Playwright | Reuse the stack and module boundaries; test actual API contracts |
| [/Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE2_SPEC.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE2_SPEC.md) | Shared AI middleware, accepted drafts, BYOK, synchronous generation, SSE coach; no required queue | Preserve optional AI and acceptance controls; add accurate context and constrained outputs |
| [/Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE3_SPEC.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE3_SPEC.md) | Focus explicitly designed as ephemeral; keyword search; note backlinks; quizzes; knowledge distillation; notification intent | Persisting focus is a deliberate successor behavior; retain recall and knowledge features |
| [/Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE4_SPEC.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE4_SPEC.md) | INR/Indian numbering, Decimal amounts, category ownership, preview/confirm imports, deduplication, responsive matrices | Keep finance semantics and import preview behavior during restyling |
| [/Users/pranav/Pranav_projects/github/no-brainy/docs/MODULAR_ARCHITECTURE_SPEC.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/MODULAR_ARCHITECTURE_SPEC.md) | Future static module registry; current navigation/search/capture/linking integration points | Use a small typed catalog if useful; defer wholesale registry/plugin refactoring |
| [/Users/pranav/Pranav_projects/github/no-brainy/docs/STABILITY_SPRINTS.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/STABILITY_SPRINTS.md) | Error feedback, skeletons, theme tokens, boundaries, validation, animation, setup improvements | Reuse this inventory in reliability/design/preservation acceptance; do not assume work is done |
| [/Users/pranav/Pranav_projects/github/no-brainy/docs/DEPLOYMENT.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/DEPLOYMENT.md) | GCP Cloud Run + Cloud SQL, migration jobs, staging/production separation, secret management, rollback | Preserve deployment compatibility; no cloud operations or spending are authorized by planning |
| [/Users/pranav/Pranav_projects/github/no-brainy/CONTRIBUTING.md](/Users/pranav/Pranav_projects/github/no-brainy/CONTRIBUTING.md) | Strict TypeScript, functional React, kebab-case files, focused branches and checks | New owner workflow adds explicit plan approval, append-only ledgers and TDD; reconcile current contributor guidance after approval |
| [/Users/pranav/Pranav_projects/github/no-brainy/SECURITY.md](/Users/pranav/Pranav_projects/github/no-brainy/SECURITY.md) | Auth, encrypted BYOK keys, secret hygiene, ownership and HTTPS expectations | Preserve existing protection and test all new user-owned relations; a personal app still keeps authentication |

## Observed implementation and documentation differences

1. The package declares Next.js 15.5.18 and React 18; several documents say Next.js 14. Follow the package/lockfile and avoid an unrelated framework upgrade.
2. Dark appearance, theme presets and a theme builder exist even though the README TODO lists them as unfinished. Preserve preferences and test compatibility.
3. Habit tables were deliberately dropped by `/Users/pranav/Pranav_projects/github/no-brainy/prisma/migrations/20260421120000_remove_habits/migration.sql`. New routine behavior extends task recurrence; it does not restore deleted historical tables or rewrite that migration.
4. The API uses `success` plus `data`/`error`, and paginated lists use `items`, `total`, `page`, `pageSize`, `hasMore`. The early technical specification shows different example envelopes. Preserve the actual shared types.
5. Current priorities are urgent/high/medium/low, whereas some specs say critical/high/medium/low. Keep persisted values; correct ordering explicitly instead of lexical sorting.
6. The task default filter excludes in-progress tasks; the list hook discards pagination metadata. Regressions must cover both.
7. Quick capture submits a date-only input to a datetime validator. Normalize the task date contract consistently, maintaining compatibility with existing clients.
8. Task autosave replaces pending partial updates; note unmount cleanup can discard a queued write. Failure-state and navigation coverage are required.
9. Planner focus selection receives only due-today and yesterday suggestions. Time blocks exist in storage/contracts without a usable editor in the inspected planner. Complete these flows.
10. AI planning prompts request 3–5 tasks while validation caps focus IDs at three. Unify and validate the limit, ownership, and resolved task previews.
11. Focus state is component-local by original phase-3 design. New durable sessions need a new model, recovery behavior, and explicit terminal states.
12. Goals expose `goalId` in backend contracts, but the inspected task forms do not present the selector and goal detail shows aggregate text instead of actionable linked rows. Connect the UI to the existing relation.
13. Insight aggregation accepts a date range but several inspected queries only constrain the lower bound. Tests must exclude future/out-of-window data and cancelled tasks. Avoid unsupported psychological interpretations in prompts.
14. The sidebar catalog includes Flashcards but its default order omits it. Library/Growth must make learning routes reachable.
15. The deployment guide describes active workflows, but the tracked templates are under `/Users/pranav/Pranav_projects/github/no-brainy/.github/workflows-disabled/`. Do not silently reactivate deployment.
16. The README names Testing Library and the technical specification names Playwright, but neither is in the current package. Existing tests are three files under the source tree; the smoke file includes trivial assertions. Preserve all existing assertions while moving tests to the approved structure; add meaningful behavior tests.
17. The frontend currently contains both `/Users/pranav/Pranav_projects/github/no-brainy/src/app/page.tsx` and `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/page.tsx`. Investigate route collision with the build before changing entry behavior; keep a regression for the authenticated entrypoint.

## Knowledge to preserve across modules

- Notes: Markdown/code/Mermaid, safe rendering, wiki links, backlinks, graph, tags, pinning, trash, editor shortcuts and export.
- Books/learning: reading progress, quotes, summaries, application notes, manual cards, AI draft review, SM-2 schedules, quiz results and source links.
- Tasks/planner: subtasks, existing statuses/priorities, matrix view, ordering, links, top-three limit, due dates, recurrence values and daily plans.
- Life: INR Decimal handling, expense imports and categories, budget/financial goal semantics, saved links, watchlist metadata, and Stash file/sensitive-content boundaries.
- Platform: user ownership, per-user keys, API envelope, existing URLs, React Query cache conventions, keyboard navigation and user theme/navigation preferences.

## Rulings proposed for owner approval

Keep one authenticated personal workspace, preserve historical records and implemented features, and focus the redesign on Today and connected actions. Maintain PostgreSQL rather than replacing persistence to avoid setup work. Use honest progress, recoverable drafts, optional AI, and restrained motion. Limit recurring presets initially to daily/weekly/monthly with a defined skip/missed-day policy; existing unsupported RRULEs remain visible without silent reinterpretation. Keep existing native-mobile, dynamic-plugin, collaboration, semantic-search and cloud-scheduling proposals outside this rebuild.

Approval of the parent package records these as the owner's implementation rulings. The owner approved the parent package on 2026-10-16 with the conversation message “approved.”
