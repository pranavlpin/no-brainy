# AGENTS.md — NoBrainy (Next.js / React / TypeScript)

Repo-level rules and guardrails for all AI agents and contributors working in this repository. Read this file fully before making any change. `CLAUDE.md` carries the same content for agents that read that filename.

## 1. Project Overview

- **App**: NoBrainy, a personal productivity and growth operating system (today cockpit, tasks, planner, reviews, goals, notes, stash, flashcards, books, expenses, budgets, insights, AI coach). Built and used by a single owner.
- **Stack**: Next.js 15 (App Router), React 18, TypeScript (strict), Tailwind CSS 3, Prisma 5 on PostgreSQL 16, TanStack React Query v5 (server state), Zustand (UI state), Zod, NextAuth v5, Vitest + React Testing Library, pnpm 9.
- **Structure**: Feature-first modules. Each functional section of the app is a module. Module names used in ledgers, plans, tests, branches, and commit prefixes: `platform` (shell, design system, motion, dates, governance), `home`, `tasks`, `planner`, `reviews`, `goals`, `capture` (quick capture, command palette), `focus`, `nav`, `mobile`, `notes`, `stash`, `flashcards`, `books`, `expenses`, `budgets`, `bookmarks`, `watchlist`, `insights`, `ai`, `notifications`, `search`, `analytics`, `settings`, `auth`.

## 2. Repository Layout Rules

| Path | Purpose | Rules |
|---|---|---|
| `docs/tasks/` | Module-level task files | One append-only file per module, e.g. `docs/tasks/tasks.md`, `docs/tasks/platform.md`. Every approved task gets a new entry here **before** implementation starts. Entries already present on the task branch's target branch are immutable. |
| `docs/plans/` | Module-wise implementation plans | One new file per task, e.g. `docs/plans/planner/morning-triage.md`. Plans are written in plan mode and approved before coding. A plan already present on the task branch's target branch is immutable. |
| `tests/` | All automated tests | Organized by type and module (see §3). |
| `docs/test-plans/` | Section-wise test plans | One plan per section, e.g. `docs/test-plans/planner.md`. |
| `evidences/` | Evidence and temporary files | Logs, run outputs, scratch files, review reports, throwaway captures. **Must be gitignored** — verify `evidences/` is in `.gitignore` before writing here. Never commit anything from this folder. |
| `docs/screenshots/<task-slug>/` | Committed per-task UI screenshots (on explicit user request only) | Captured only when the user asks for a visual check or visual evidence — never required by default; the task entry and plan file are the sufficient record otherwise. When requested: before/after captures, downscaled (≤ ~480 px wide). Each folder carries a `README.md` with capture notes (viewport, theme, account, per-image mapping to the defect/feature) and is referenced from the task's plan and test plan. Folder slug matches the plan file name. Review/history references only — never test fixtures. |

- Never place task notes, plans, or evidence anywhere else in the repo.
- Do not create ad-hoc scratch files in `src/` or the repo root; use `evidences/`.
- Per-task UI screenshots are the one form of evidence that is committed, and they are captured only when the user explicitly asks for a visual check. All other evidence stays in gitignored `evidences/`.
- Product and architecture documents that predate this file (`docs/*.md` such as the PRD and phase specs) are historical context, not ledgers; do not edit them to describe newer behavior.

### 2a. Absolute rule — immutable task and plan history

- **Historical task plans are immutable.** Any `docs/plans/**/*.md` file already present on the task branch's target branch is a historical record. Never modify, rename, move, delete, or repurpose it. A plan newly introduced by the current task may be refined on that task branch until it lands; after landing, it is immutable.
- **Historical task entries are immutable.** Any task row or task section already present on the target branch under `docs/tasks/` must remain byte-for-byte intact: never edit its wording, status, links, ordering, or meaning, and never delete it. A task entry newly introduced on the current task branch may receive its final status before that branch lands; after landing, it is immutable.
- **Every change to an existing implementation requires a new task entry and a new plan.** This includes corrections, reversals, owner rulings, review remediation, config/workflow changes, and small follow-ups. Never reopen the earlier plan to describe the new behavior.
- **Successor plans must link every predecessor plan that they change or supersede.** The successor must describe the behavioral delta and why it was made. If there is no predecessor because the work is genuinely new, say so explicitly.
- **Task and test-plan ledgers remain append-only.** Add a successor task row and a new test-plan section for later work; do not rewrite, reorder, or remove historical entries or sections to make them describe current behavior.
- An old plan accurately describing an old implementation is history, not documentation drift. The defect is a missing successor task/plan or missing lineage link. Current code-facing documentation (README, inline docs) may be updated when needed, but historical task plans may not.
- These rules are mandatory, prospective, and have no cleanup exception.

## 3. Test Organization

All automated tests live under `tests/`, mirrored by module and separated by type:

```
tests/
  unit/<module>/            # pure functions, hooks logic, parsers, date helpers, Zod schemas
  component/<module>/       # React components rendered with React Testing Library (jsdom)
  integration/<module>/     # API route handlers and multi-module flows (mocked Prisma or test DB)
docs/test-plans/<section>.md  # section-wise test plans
```

- Test file names mirror source files: `src/lib/dates/user-today.ts` → `tests/unit/platform/user-today.test.ts`; `src/components/tasks/task-list.tsx` → `tests/component/tasks/task-list.test.tsx`; `src/app/api/planner/today/route.ts` → `tests/integration/planner/today-route.test.ts`.
- Every module's test scripts stay inside that module's folder — no loose test files at `tests/` root and none under `src/`.
- Each section must have a test plan in `docs/test-plans/` before automated tests are written for it.
- Vitest is configured in `vitest.config.ts` (`tests/**/*.test.{ts,tsx}`, jsdom, `@/` alias). Run with `pnpm test`.

## 4. Git & Commit Rules

- **Branching**: Every task gets its own branch (`feature/<module>-<task>`, `bugfix/<module>-<issue>`, `test/<module>-<scope>`). Never commit directly to `main`. An owner may rule that a batch of registered tasks lands on one integration branch; the ruling is recorded in the ledger and each task still gets its own plan, entry, tests, and commits.
- **Merging**: Only via PR. PR must be code-reviewed before merge. No direct merges to `main`.
- **Commit size (suggestive, not mandatory)**: Any change exceeding ~1000 lines should be split into separate logical commits to keep code review easy.
- Commit messages: imperative mood, prefixed with module, e.g. `planner: add morning triage actions`.
- Never commit: `evidences/`, `.env` and `.env.*` (except `.env.example`), `node_modules`, `.next`, generated Prisma client output, secrets, service-account keys.
- **Doc-ledger merge conflicts are resolved keep-both.** `docs/tasks/*.md` and `docs/test-plans/*.md` are append-only ledgers: parallel branches add their sections at the same spot, so merge conflicts there are positional, not semantic. Resolve by keeping **both** sides' sections intact (a `---` separator between them) — never by picking one side.
- **No AI attribution, ever**: no `Co-Authored-By` trailers naming an agent, no "Generated with" footers, no agent credit of any kind in commits, PR titles/bodies, code comments, or docs. All commits and pushes are made under the owner's own git identity (`pranav@aiequmobility.com`); agents must never substitute their own.

## 5. Formatting & Code Quality Guardrails

- Run `pnpm format` (Prettier) before every commit. No unformatted code in PRs.
- `pnpm lint` (`next lint`) and `pnpm typecheck` (`tsc --noEmit`) must pass with **zero warnings/errors** before a PR is opened. Do not weaken lint rules or `tsconfig` strictness without explicit user approval.
- No stray `console.log` in committed code. Server-side failures are logged through the API error helper; client code uses the toast/error boundary paths.
- No commented-out code blocks in PRs.
- Exported functions and components in shared code (`src/lib/**`, `src/components/ui/**`) carry a short JSDoc comment.
- Server state lives in React Query hooks under `src/hooks/`; UI-only state lives in Zustand stores under `src/stores/`. Follow the existing pattern — do not introduce a new state, routing, styling, or animation library without explicit approval. Approved animation library: `framer-motion` via the wrappers in `src/components/motion/`.
- Dependency changes (`package.json` / `pnpm-lock.yaml`) always require explicit user approval and their own commit.
- All user-facing dates and "today" boundaries must go through `src/lib/dates/` helpers that honor the user's timezone. Never compute a calendar date with `toISOString().slice(0, 10)` or `Date.UTC(...)` in product code.
- Respect `prefers-reduced-motion`: every animation goes through the motion wrappers, which disable non-essential motion when the user asks for it.
- Run `pnpm test` locally; all tests green before opening a PR.

### 5a. Stable test ids

- Every new or materially changed interactive, stateful, or repeated UI element must carry a stable `data-testid` at its meaningful component or interaction boundary.
- Derive test ids from stable domain identifiers (`task-row-${task.id}`, `focus-slot-2`, `nav-item-/planner`). Never derive them from localized copy or changing display values.
- Decorative child elements do not each require a test id. Test ids do not replace accessibility semantics (`role`, `aria-label`, labelled controls).
- Where clearer and less brittle than visible-text matching, tests locate affected interaction boundaries by their test ids.

## 6. General Agent Guardrails

- Never skip a workflow step based on assumption. If information is missing, **ask the user explicitly**, unless the owner has recorded a ruling in the ledger that pre-authorizes the decision for the current task batch.
- Never delete or rewrite existing tests to make code pass. Fix the code.
- Do not push, merge, tag, or release without explicit instruction.
- Keep changes scoped to the task at hand; no drive-by refactors without approval.
- **Docs and code must remain traceable without rewriting history.** Plans, task rows, and test plans are part of the deliverable, not commentary. When behavior changes, add a successor task and plan in the same commit/PR as the code and link the predecessor plan(s); update only current code-facing documentation. Unresolved decisions in the new plan must carry a recorded ruling before implementation lands.

## 7. Workflows

All work must follow the applicable workflow. The steps below are the canonical copy.

Common to all workflows: plan mode first → explicit user approval → task file entry → failing tests (TDD) → implementation → PR + review before merge. Review approval is a merge gate only; it does not authorize an agent to launch a review.

> **MANDATORY** (applies to every workflow below): All steps are mandatory and must be followed step by step, in order. No step may be skipped based on any assumption. If anything is unclear or missing, ask the user explicitly before proceeding, unless a recorded owner ruling covers the decision.

Every workflow invocation creates a new task entry and a new task plan. If work changes an existing implementation, the new plan links the plan(s) behind that implementation and records the delta; no workflow step may edit a historical task entry or plan.

### Feature development

1. **Branch**: Create a new branch for the task: `feature/<module>-<task-name>`. Never work on `main`.
2. **Plan mode**: Start in plan mode. Create a detailed implementation plan in `docs/plans/<module>/<task-name>.md` highlighting:
   - Scope and affected modules/files
   - Dependencies (packages, APIs, other modules, schema changes)
   - Data model / state changes (Prisma migration, React Query keys, Zustand stores)
   - UI/UX considerations, including motion and reduced-motion behavior
   - For new or materially changed UI: test-id strategy, automation lookup boundaries, and accessibility semantics impact
   - Risks and open questions
3. **Approval**: Ask for explicit user approval of the plan. Do not start implementation without it.
4. **Task entry**: After approval, add an entry for this task in the module's task file at `docs/tasks/<module>.md` (task name, date, branch, plan link, status).
5. **TDD — failing tests first**: Write automated test cases that fail, covering the planned behavior. Place them per §3. Ensure a section test plan exists in `docs/test-plans/`.
6. **Implement**: Make code changes until all tests pass. Follow §5 and §5a.
7. **Verify**: Run `pnpm format`, `pnpm lint`, `pnpm typecheck`, and the full `pnpm test` suite. Store scratch evidence (logs, run outputs) in `evidences/`. Screenshots only on explicit request per §2.
8. **Update task file**: Mark the task entry status and note test results.
9. **PR**: Push the branch and create a PR. Do not merge directly to `main`. Merge only after code review approval.

### Bug fixes

1. **Branch**: `bugfix/<module>-<issue-id-or-short-name>`. Never work on `main`.
2. **Plan mode**: Create a plan in `docs/plans/<module>/<bug-name>.md` covering reproduction steps and root cause, affected files and blast radius, related bugs, proposed fix, and (for UI) test-id strategy and accessibility impact.
3. **Approval**: Ask for explicit user approval of the plan. Do not start the fix without it.
4. **Task entry**: Add an entry in `docs/tasks/<module>.md` (bug reference, date, branch, plan link, status).
5. **TDD — failing regression test first**: Write an automated test that reproduces the bug and fails. Place it per §3.
6. **Fix**: Make the minimal code change that makes the regression test (and all existing tests) pass. No unrelated refactors. Follow §5a for any UI touched.
7. **Verify**: `pnpm format`, `pnpm lint`, `pnpm typecheck`, full `pnpm test`. Capture scratch evidence in `evidences/`.
8. **Update task file**: Mark the entry fixed with a note on root cause.
9. **PR**: Push the branch and create a PR. Merge only after code review approval.

### Testing

1. **Branch**: `test/<module>-<scope>`. Never work on `main`.
2. **Plan mode**: Create or update the section-wise test plan in `docs/test-plans/<section>.md` and a task plan in `docs/plans/<module>/<task-name>.md` covering scope and test types, coverage targets and priority scenarios, and dependencies (mocks, fixtures, test DB).
3. **Approval**: Ask for explicit user approval of the plan.
4. **Task entry**: Add an entry in `docs/tasks/<module>.md`.
5. **TDD ordering**: Write the automated test cases first. If they target unimplemented or buggy behavior, they must fail initially; code changes follow after the tests exist.
6. **Organize**: Place tests per §3. No loose test files.
7. **Verify**: `pnpm format`, `pnpm lint`, `pnpm typecheck`, full `pnpm test`. Store run outputs in `evidences/`.
8. **Update task file and test plan**: Record results and coverage.
9. **PR**: Push the branch and create a PR. Merge only after code review approval.

### 7a. Absolute rule — no workflow shortcuts, ever

**Zero code edits are permitted before all three of these have happened, in order, for every task:**

1. A plan is written to `docs/plans/<module>/<task-name>.md`.
2. The user has explicitly approved that plan in this conversation, or a recorded owner ruling in the ledger pre-approves the plan for the current task batch.
3. A row for the task exists in `docs/tasks/<module>.md`.

Then TDD begins — a failing test is written and confirmed to fail before the implementation is written.

**No exceptions.** None of the following authorises skipping any step: "It's a one-line fix." "It's clearly localized to one file." "The user is waiting." "I already know the root cause." "The tests will still be green after." "This is just polish / config / docs." "The user described the fix in the message."

If any of those reasons feels compelling, **stop and follow the workflow anyway**. When in doubt whether a request is a "task" that triggers this rule, assume yes.

An agent that has already broken this rule on prior turns of a conversation does not get to keep breaking it. The next task in the same conversation resumes the strict workflow.

## 8. Code Review

- **User-triggered only:** Never run a code review, spawn the `code-reviewer` agent, or create a review report unless the user's current request explicitly asks to review or audit a PR, branch, diff, or WIP.
- Completing implementation, passing gates, committing, pushing, opening a PR, or asking whether work is ready does not authorize a review.
- Each explicit user request authorizes exactly one review run. Re-reviewing after fixes requires a new explicit request.
- Reviews grade findings **Critical / Warning / Suggestion** across technical, functional, and architectural lenses, run the static gates (§5), and write a report to `evidences/reviews/<target>/` (gitignored — never commit reports).
- Posting a review as a PR comment requires an explicit user instruction; a review run must never post to GitHub on its own.
- In Claude Code: invoke with `/code-review` (current diff) or `/code-review <PR#>`; the `code-reviewer` subagent in `.claude/agents/` wraps the same rubric for large diffs.
