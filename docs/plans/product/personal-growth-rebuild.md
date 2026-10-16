# NoBrainy personal productivity and growth rebuild

Date: 2026-10-16 (Asia/Kolkata)
Status: APPROVED — owner approved this complete package and its listed development dependencies on 2026-10-16 with the conversation message “approved.”
Planning branch: `feature/product-personal-growth-plan`
Baseline: `main`, commit `01845cfa639f843dfb59f87558acc176338bb4c8`.
Repository: https://github.com/pranavlpin/no-brainy
Checkout: `/Users/pranav/Pranav_projects/github/no-brainy`

## Approval and scope

The owner requested a complete usable personal productivity/growth app, a full UI redesign including backgrounds and transitions, autonomous routine product decisions, TDD, and the supplied Flutter workflow adapted to React. The owner's later workflow requires a written plan, explicit approval of that plan, and an approved task-ledger entry before tests or implementation. The earlier instruction to work without stopping does not itself approve these newly written plans.

This is the planning-only phase. The session currently provides Default collaboration mode, so no claim is made that a tool switched it into formal Plan mode. Product code, automated tests, dependencies, database contents, and active repository rules remain unchanged. Only the new planning documents and section test plans are prepared. The proposed registry below registers all intended work; approved entries will be appended to the module ledgers after approval, in the order required by the owner.

An explicit approval of this package can approve the 14 individually linked task plans together, including the developer-only packages listed in NB-02. No repeated approval is needed for the described steps. Material scope or dependency changes need a successor plan/ruling. Approval does not authorize pushing, PR creation, merging, production migration, cloud deployment, external messaging, or a code-review run.

## Product contract

Deliver an evolution of the existing React/Next.js application: one coherent workspace for capture, work, deliberate practice, reflection, and personal life. Retain working notes, Markdown editing, links/graphs, books, flashcards, quizzes, expenses, budgets, bookmarks, watchlist, Stash, search, notifications, theme preferences, and optional BYOK AI.

The primary loop is Capture → Process inbox → Plan Today → Focus → Reflect → Adjust the week. Primary navigation is Today, Inbox, Projects, Growth, and Library, with Tasks easy to reach and existing Life utilities grouped visibly. Work / Personal / All is a filter, not a separate account or duplicate database. Existing deep links remain valid.

The full UI redesign uses a warm neutral canvas, restrained teal/blue accents, soft background gradients, readable typography, consistent surfaces, a useful dark appearance, and mobile navigation. Small feedback transitions start around 120–180 ms; panels and mode changes around 180–280 ms. These are design values to validate, not measured performance claims. Preserve keyboard focus and respect reduced motion. Use CSS/native browser animation with the existing stack; no new animation library is proposed.

The app supports a realistic day and gentle recovery: one main outcome plus up to two supporting priorities, optional effort estimates, adjustable capacity, explicit rescheduling, optional reflection/mood, breaks, and partial progress. Rest/skip is valid. Avoid guilt scores, punitive streaks, mandatory journaling, or psychological explanations inferred from unrelated records. The app does not prescribe medical treatment or decide life priorities irreversibly.

## KT and predecessor history

Read the KT record at [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/repository-kt.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/repository-kt.md).

There are no historical task plans, task ledgers, or section test plans at this baseline. The existing PRD, technical specifications, phase specifications, stability roadmap, deployment guide, contribution guide, and security policy provide background and design history. Their status labels do not prove feature completion. This package preserves them; successors explicitly describe deltas. Newly added plans link dependencies and predecessor plans inside this package where they change the earlier task's implementation.

## Proposed task registry

Every row is APPROVED / NOT STARTED as of the owner’s 2026-10-16 approval. Branches below are intended task branches, not a claim they have been created. Each plan identifies its future module ledger and its section test plan. On approval, create the ledger entries before automated tests or implementation.

| ID | Task | Branch | Depends on | Written plan |
|---|---|---|---|---|
| NB-01 | Install identical React repository rules | `feature/workflow-react-governance` | — | [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/workflow/react-governance.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/workflow/react-governance.md) |
| NB-02 | Establish test gates and a runnable environment | `test/platform-react-tdd-foundation` | NB-01 | [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/platform/react-tdd-foundation.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/platform/react-tdd-foundation.md) |
| NB-03 | Restore task, date, and autosave reliability | `bugfix/tasks-persistence-and-discovery` | NB-02 | [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/tasks/persistence-and-discovery.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/tasks/persistence-and-discovery.md) |
| NB-04 | Redesign shared UI, navigation, and motion | `feature/design-personal-workspace` | NB-03 | [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/design/personal-workspace.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/design/personal-workspace.md) |
| NB-05 | Add projects, planning fields, and recurrence | `feature/projects-outcomes-and-routines` | NB-03, NB-04 | [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/projects/outcomes-and-routines.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/projects/outcomes-and-routines.md) |
| NB-06 | Build Inbox and resilient capture | `feature/inbox-capture-and-process` | NB-04, NB-05 | [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/inbox/capture-and-process.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/inbox/capture-and-process.md) |
| NB-07 | Build Today and editable scheduling | `feature/planner-today-and-capacity` | NB-05, NB-06 | [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/planner/today-and-capacity.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/planner/today-and-capacity.md) |
| NB-08 | Persist focus sessions and results | `feature/focus-durable-sessions` | NB-07 | [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/focus/durable-sessions.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/focus/durable-sessions.md) |
| NB-09 | Connect growth outcomes, practice, and evidence | `feature/growth-practice-and-evidence` | NB-05, NB-07, NB-08 | [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/growth/practice-and-evidence.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/growth/practice-and-evidence.md) |
| NB-10 | Build daily shutdown and weekly adjustment | `feature/reviews-reflection-to-action` | NB-07, NB-08, NB-09 | [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/reviews/reflection-to-action.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/reviews/reflection-to-action.md) |
| NB-11 | Ground optional AI in accurate context | `feature/ai-contextual-assistance` | NB-07, NB-09, NB-10 | [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/ai/contextual-assistance.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/ai/contextual-assistance.md) |
| NB-12 | Integrate and restyle existing Library/Life features | `feature/library-preserve-and-integrate` | NB-04, NB-09, NB-10 | [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/library/preserve-and-integrate.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/library/preserve-and-integrate.md) |
| NB-13 | Add core-workspace backup and personal setup | `feature/data-personal-setup-and-backup` | NB-06, NB-09, NB-10, NB-12 | [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/data/personal-setup-and-backup.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/data/personal-setup-and-backup.md) |
| NB-14 | Verify integrated use and prepare the handoff | `test/product-final-acceptance` | NB-01 through NB-13 | [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/final-acceptance.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/final-acceptance.md) |

## Architecture and migration decisions

- Retain Next.js App Router, React 18, strict TypeScript, Tailwind 3, Zustand for UI/session presentation, React Query for remote data, Zod validation, PostgreSQL/Prisma, and NextAuth. Preserve the current response envelope in the actual shared API types, rather than copying an outdated specification example.
- No separate SQLite/standalone application, framework rewrite, global credential changes, native mobile app, dynamic plugin loader, or collaboration system is part of this package.
- Add a small typed navigation/catalog configuration where it reduces duplication. Keep Prisma and server-only code out of client bundles. Do not implement the entire future modular-plugin specification.
- New persistent concepts are Project, Capture, FocusSession, GrowthEvidence, and WeeklyReview. Extend Task, DayPlan, Goal, and DailyReview with optional fields and backward-compatible defaults. Specific ownership/uniqueness rules live in each module plan.
- Treat date-only values as calendar dates in the saved user timezone; default setup proposes Asia/Kolkata and allows correction. Timestamps remain UTC instants. Preserve deadlines independently from planned days. Reject invalid IANA zones and invalid calendar dates.
- Schema changes use new additive migrations. Test upgrading a populated disposable baseline database, including existing notes, financial records, and links. Never reset a database containing user data. Archive/cancel behavior must preserve historical focus and growth records.
- PostgreSQL remains authoritative. Local persistence protects drafts and an in-progress focus session; it is not a second task database. Offline saved drafts must be visibly distinguished from server-saved records. Retry uses stable request IDs and an explicit conflict state where needed.
- Core functionality works with no AI key. Existing file-storage and metadata integrations retain their setup requirements and show actionable errors if unavailable.

## Branch, history, and commit sequence

This branch prepares the approval package only. After approval, NB-01 starts on its named branch carrying the approved planning package. Subsequent task branches may be stacked on the completed predecessor branch so the final branch contains the integrated app for local testing. Record the immediate target/base SHA in each task ledger before implementation; inherited plans/entries are immutable. No direct merge to main occurs. Later PRs can target the appropriate predecessor until the stack is ready; rebasing or retargeting must preserve lineage.

Use small logical commits when authorized, with the user's work identity (`Pranav`, `pranav@aiequmobility.com`) verified before creating them. Dependency changes are their own commit. No push, PR write, merge, release, review report, or production operation occurs without its applicable authorization. Existing CI/CD templates are disabled; do not activate them silently.

## Test and runtime prerequisites

The checkout has no installed dependencies and no local environment configuration. `pnpm`, Docker, PostgreSQL client/server commands were not found in the current executable search path. Node and npm are available. A dependency installation attempt made before the new workflow failed because the session could not resolve the npm registry hostname; it exited without a tracked source change. This is an infrastructure failure, not a TDD red result.

NB-02 proposes adding only development tools: React Testing Library, DOM Testing Library, user-event, jest-dom, Playwright Test, and Prettier. Existing Vitest/jsdom/TypeScript/ESLint remain. Versions must be compatible with this React 18 stack, verified at installation, and recorded in the existing pnpm lockfile. The batch approval must explicitly include these packages; no production dependency is proposed.

Use a dedicated disposable PostgreSQL test database and a separate development database. Never use production credentials or run the existing seed against unknown data. Complete private configuration without printing secrets. If package downloads, a test browser, database access, or loopback serving are blocked by the environment, report the exact failed gate and required external action. Do not replace the stack or count a blocked command as a pass.

## TDD and final acceptance

Each approved task follows: task branch → written approved plan → approved ledger row → section test plan → executable failing behavior test → smallest implementation → green test → refactor → full relevant gates → ledger result. Foundational documentation/config work uses executable parity/layout/config checks; it is not treated as exempt from the requested TDD discipline.

All new automated tests belong under `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/<module>/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/component/<module>/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/<module>/`, or `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/<module>/`. NB-02 moves existing tests with their assertions preserved and verifies discovery. Tests prefer roles/labels, stable domain IDs for repeated boundaries, and explicit `data-testid` only where appropriate. React keys do not serve as DOM locators.

Automated screenshot capture is off by default. Functional browser checks, keyboard interaction, viewport checks, and reduced-motion checks are part of verification. Screenshot artifacts are created/committed only on explicit request. Red/green logs and temporary output go into `/Users/pranav/Pranav_projects/github/no-brainy/evidences/` only after NB-01 adds and verifies the ignore rule.

The final product gate includes:

1. Register/sign in with the normal auth flow, land on Today, choose context, and preserve existing deep links.
2. Capture an item, reload, convert it once into a linked task/project, and find it through search.
3. Reach every active task in a dataset larger than one page, including in-progress work.
4. Plan an undated task without changing its deadline; create/edit a time block and handle insufficient capacity.
5. Start/pause/reload/resume a focus session; capture an interruption; record partial progress or completion exactly once.
6. Link a goal to an action, record evidence and practice, and retain truthful progress after adding more tasks.
7. Close the day, reschedule intentionally, and turn a weekly reflection into a next action.
8. Exercise notes/links, books, flashcards, expenses/budgets, bookmarks/watchlist, Stash, search, notifications, settings, and dark appearance after the shared UI changes.
9. Verify saving failures, retry, unsaved drafts, server errors, cross-owner access rejection, India-midnight behavior, recurrence boundaries, and multiple-tab focus recovery.
10. Pass formatting, TypeScript, ESLint with zero warnings/errors, Prisma validation, unit/component/integration tests, browser journeys, and production build. List any genuine unavailable gate explicitly.
11. Provide a verified local URL, exact startup steps, current task/test status, and a short first-use walkthrough. A screenshot, mockup, or static demo is not the final app.

## Approval record

Approved on 2026-10-16 by the owner’s conversation message “approved.” in direct response to the request to approve this complete 14-plan package and the six testing/formatting dependencies listed in NB-02. The product decisions above are approved rulings. Remote operations and code-review runs remain outside this approval. Task execution/results belong in the module ledgers; this approval does not claim implementation or tests are complete.
