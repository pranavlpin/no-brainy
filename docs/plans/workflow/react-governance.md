# NB-01 — Install React repository governance

Date: 2026-10-16 (Asia/Kolkata)
Status: APPROVED on 2026-10-16; implementation results are recorded in the task ledger.
Task branch: `feature/workflow-react-governance`
Future task ledger: `/Users/pranav/Pranav_projects/github/no-brainy/docs/tasks/workflow.md`
Test plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/workflow.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/workflow.md)
Package: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md)

## Predecessors and behavioral delta

There is no historical task plan or existing root AGENTS/CLAUDE file at baseline. The owner supplied the Flutter rules in the conversation and requested matching React rules. Preserve their plan-approval/TDD/history/branch/review restrictions; replace Flutter tooling, widgets and keys with React/Next.js tooling, component tests, domain keys and DOM lookup boundaries. This is a new governance installation, not a retroactive rewrite of old project specifications.

## Scope and affected files

- Create `/Users/pranav/Pranav_projects/github/no-brainy/AGENTS.md` and `/Users/pranav/Pranav_projects/github/no-brainy/CLAUDE.md` with byte-identical content from the draft below, after approval.
- Add the literal ignore patterns `/evidences/`, `/playwright-report/` and `/test-results/` to `/Users/pranav/Pranav_projects/github/no-brainy/.gitignore`; verify evidence ignoring before writing logs. Existing ignore rules remain intact.
- Reconcile current workflow guidance in `/Users/pranav/Pranav_projects/github/no-brainy/CONTRIBUTING.md` to point to the canonical rules, preserving code style and license guidance. This is current documentation, not immutable plan history.
- Add `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/workflow/governance.test.mjs` using Node's built-in test runner for governance parity and evidence isolation, independent of downloaded packages.
- Append the approved task entry to `/Users/pranav/Pranav_projects/github/no-brainy/docs/tasks/workflow.md` before writing that test.

## TDD and verification

First run assertions that both canonical files exist and match, expected React workflow requirements are present, Flutter commands are absent, and Git ignores evidence. Confirm the behavioral failures against the current missing files/rule. Then install the identical documents and ignore patterns and rerun to green. Initially keep output in the tool transcript; save it to evidence only after ignoring is verified. Later NB-02's test command includes this Node suite.

Check existing documentation remains unchanged except the explicitly listed current contribution guide. The registry retains pending status until the owner approves. Neither writing rules nor an approved build plan authorizes pushes or a review run.

## Risks and resolved choices proposed for approval

- Case-sensitive conventional filenames are AGENTS.md and CLAUDE.md, not duplicate lower-case aliases.
- The current session has no formal Plan-mode switch. A planning-only phase with written plans and explicit approval is the fallback; no tests or code are written during it.
- One explicit batch approval may cover the already-written named task plans and listed tooling packages. Every task still needs its own plan, branch, ledger row, and red/green record.
- The supplied review skill path does not exist here. Do not claim that it exists or silently substitute an unrequested review. A requested future review must resolve its procedure before starting.
- Automated screenshot capture stays disabled unless the owner specifically requests visual checks/evidence. Functional browser tests do not require screenshot artifacts.

## Proposed identical contents of both root files

The following fenced block is the complete reviewable draft. It is not yet an active root instruction file.

~~~~markdown
# Repository rules — NoBrainy (React / Next.js)

Repo-level rules and guardrails for contributors working in this repository. Read this file fully before making changes. `/Users/pranav/Pranav_projects/github/no-brainy/AGENTS.md` and `/Users/pranav/Pranav_projects/github/no-brainy/CLAUDE.md` must remain byte-for-byte identical.

## 1. Project overview and KT

- App: NoBrainy, a personal productivity, learning and growth workspace. Primary use: one person's work, tasks, notes, learning, reflection and personal utilities.
- Stack: React 18, Next.js App Router, strict TypeScript, Tailwind CSS 3, Zustand for client UI state, TanStack React Query for server state, Zod, PostgreSQL with Prisma, NextAuth, Vitest. Optional AI uses the existing BYOK integration.
- Structure: feature-oriented components, hooks, API handlers, types and validation. Preserve the existing structure; a new directory layout or framework is not implied by this document.
- KT sources: `/Users/pranav/Pranav_projects/github/no-brainy/README.md`, `/Users/pranav/Pranav_projects/github/no-brainy/CONTRIBUTING.md`, `/Users/pranav/Pranav_projects/github/no-brainy/SECURITY.md`, and relevant specifications under `/Users/pranav/Pranav_projects/github/no-brainy/docs/`. Cross-check claims against the current package, schema, migrations and code. Preserve historical specifications and record successor deltas.
- Keep existing module functionality, data, deep links and authentication unless an approved task specifically changes them. Core workflows must remain usable without an AI key.

## 2. Repository layout rules

| Absolute location | Purpose and rules |
|---|---|
| `/Users/pranav/Pranav_projects/github/no-brainy/docs/tasks/<module>.md` | One append-only task ledger per module. An approved task gets an entry before tests or implementation. |
| `/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/<module>/<task-name>.md` | One written implementation plan per task. Obtain explicit approval before implementation. |
| `/Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/<section>.md` | Append-only section test plans, written before tests for the section. |
| `/Users/pranav/Pranav_projects/github/no-brainy/test/` | All automated tests, separated by type and module as defined below. |
| `/Users/pranav/Pranav_projects/github/no-brainy/evidences/` | Logs, red/green results, scratch work, temporary files and authorized review reports. Verify Git ignores this directory before writing anything in it. Never commit its contents. |
| `/Users/pranav/Pranav_projects/github/no-brainy/docs/screenshots/<task-slug>/` | Committed screenshots only when explicitly requested. Width at most approximately 480 px. Include a README with viewport/device/browser, account context without secrets, and per-image feature/defect mapping. Link the folder from the task plan and section test plan. |

Do not place task notes, plans, or scratch evidence elsewhere in the repository. No ad-hoc scratch files in the source tree or root. Screenshot records are not test fixtures and are never required by default. Functional browser verification can run without creating screenshots. Temporary browser artifacts, downloads and reports belong in the ignored evidence directory.

### 2a. Immutable task and plan history

- Any task plan already present on the task branch's recorded target/base branch is historical. Never edit, rename, move, delete or repurpose it. A newly introduced plan may be refined before landing; material scope changes require renewed approval.
- Any historical task row/section remains byte-for-byte intact, including wording, status, order and links. Newly introduced entries may receive their final results before landing.
- Every later change to an implementation needs a new task entry and new plan, including corrections, owner rulings, config/documentation changes, review remediation and small follow-ups. Never reopen a historical plan to describe new behavior.
- Link every predecessor plan changed or superseded by a successor. Describe the delta and reason. If no historical plan exists, state that explicitly and cite the implementation/specification baseline.
- Task and test-plan ledgers remain append-only. Add new sections for successor work; do not rewrite old results.
- There is no history-cleanup exception. Old plans describing old behavior are legitimate history. Fix missing lineage with a successor, not by retroactively editing old plans.

## 3. Test organization and TDD

| Test type | Absolute location |
|---|---|
| Unit/domain | `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/<module>/` |
| React components/hooks | `/Users/pranav/Pranav_projects/github/no-brainy/test/component/<module>/` |
| API/database/integration | `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/<module>/` |
| Browser journeys | `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/<module>/` |

- Test filenames mirror the source behavior: `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/tasks/recurrence.ts` maps to `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/tasks/recurrence.test.ts`.
- No loose test scripts at the test root. Shared harnesses/fixtures belong in a named platform/shared module directory.
- A section test plan must exist before its automated tests are written.
- Write a meaningful failing behavior/regression test and run it before the implementation. Missing packages, unavailable databases and invalid test configuration are infrastructure failures, not proof of a red behavior test.
- Record red → green → refactor and exact commands/results. Preserve existing tests and assertions; never weaken/delete them to obtain a pass. Moving legacy tests needs a planned, assertion-preserving migration and discovery verification.
- Use Vitest for unit/component tests, React Testing Library for user-visible component behavior, and Playwright for browser journeys once their dependency installation has been explicitly approved. Use disposable PostgreSQL databases for database integration/migration tests.
- Prefer role, accessible name and label queries. Use a stable `data-testid` at meaningful interaction/repeated boundaries when semantic queries are ambiguous. React `key` is not a DOM locator.
- Use stable domain IDs for repeated React keys; do not use changing copy, random values or array positions when stable IDs exist. Decorative children need no artificial test ID.

## 4. Git and commit rules

- Every task gets its own branch: `feature/<module>-<task>`, `bugfix/<module>-<issue>`, or `test/<module>-<scope>`. Never implement or commit directly on main.
- Record the branch's target/base and SHA. Stacked task branches are allowed when the approved plan calls for them; predecessor history remains immutable.
- Merge only through a PR after requested code review and explicit merge authorization. A local completed branch is not merged work.
- Push, open/update a PR, merge, tag, publish or release only with the applicable explicit instruction. An ordinary build instruction does not authorize those remote operations.
- Prefer logical commits; roughly 1,000 changed lines is a useful review-size signal, not a mandatory hard limit.
- Use imperative, module-scoped messages such as `tasks: preserve pending autosave updates` or the repository's conventional equivalent.
- Use the user's identity: `Pranav <pranav@aiequmobility.com>` for this authorized work context. Verify effective author/committer settings and environment overrides before commits; use command-local settings rather than changing global identity.
- Never add agent credit or attribution trailers/footers in commits, PRs, comments or documentation.
- Never commit evidence, secrets, private exports, environment files, dependency folders, build outputs, Prisma generated clients, browser reports, or TypeScript caches. Commit intentional schema migrations and the existing package-manager lockfile.
- Resolve task/test-plan ledger conflicts by keeping both complete sections intact. Reconstruct duplicated scaffold if necessary; never choose one side and discard a task's history.

## 5. Formatting and code-quality guardrails

- Use strict TypeScript, functional React components and the existing naming conventions. Avoid `any`; narrow external data with Zod or explicit runtime checks.
- Preserve state, routing and dependency-injection patterns. Do not add a state manager, UI framework, animation package, database or service without explicit approval.
- Package additions/changes always need explicit approval and their own logical commit, with a pnpm lockfile update. Do not create a second package-manager lockfile.
- Format changed files before each commit; run the approved formatter check. Existing historical plans and ledger sections must not be reformatted.
- Type checking and ESLint must pass with zero warnings/errors before a PR. Do not weaken rules, hide warnings or disable tests to pass a gate.
- Run the complete approved test suite and production build for integrated changes. Validate and generate Prisma where schema changes require it. Use actual command results, not assumptions.
- The intended commands, once NB-02 establishes them, are `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm exec prisma validate`, and `pnpm build`, executed from `/Users/pranav/Pranav_projects/github/no-brainy`. Until scripts exist, run verified equivalent commands; never claim an unavailable command passed.
- No debug `console.log` or commented-out code blocks in committed product code. Use the existing structured logging/error-handling pattern; never log credentials or private content.
- Shared/public APIs require TSDoc comments explaining contract and failure behavior. Keep server-only imports out of client bundles and hook dependency lists correct.
- Preserve translated strings if localization exists. Do not introduce a localization framework solely for a bounded task.
- Use semantic HTML, associated labels, visible keyboard focus, accessible names and correct dialog behavior. Stable keys/test IDs do not replace accessibility semantics.
- Respect reduced motion; animation must not block input or hide errors. Preserve drafts and communicate pending/error/confirmed save states accurately.
- Validate every new relationship against the authenticated owner. Personal use does not justify bypassing authentication.
- Use new non-destructive migrations; do not reset user databases. Keep date-only calendar values distinct from UTC timestamps and apply the user's saved timezone consistently.

## 6. General guardrails

- Do not skip workflow steps because a change seems small, urgent, cosmetic or obvious. If a required decision is missing, ask explicitly.
- Preserve existing tests, unrelated changes and user data. No drive-by refactors outside the approved scope.
- Plans/task/test-plan records are deliverables. A successor must accompany changed behavior with lineage; update current code-facing documentation where appropriate, not historical plans.
- Read the relevant KT documents before planning; use current code for implementation facts. Record discrepancies rather than silently applying stale examples.
- Distinguish approval, progress and completion. Never claim tests, live UI, persistence, deployment or review were verified if the corresponding gate did not run.
- Environment restrictions do not authorize changing stacks, credentials, accounts or protected configurations. Prepare a concrete workaround/ruling for approval if necessary.
- Use full absolute local paths and complete web URLs in user-facing updates, artifact handoffs, plans, issue/PR descriptions and evidence references. Never invent a hosted URL for a local file.

## 7. Canonical workflows

Each invocation creates a new task plan and task entry. All workflows use planning first → explicit approval → ledger entry → failing tests → implementation → verification → final ledger results → authorized PR → requested review before an authorized merge.

Use formal Plan mode when the environment supports switching to it. Otherwise enter a planning-only phase: inspect and write the plan, obtain explicit approval, and make no implementation/test edits before approval. This fallback never waives approval.

A single explicit owner approval may cover a named batch of already-written plans and explicitly listed dependencies. It does not approve unwritten future plans, new dependency choices or material scope expansion. Routine decisions already delegated and recorded in an approved plan do not need repeated permission.

### Feature development

1. Create the task's feature branch and record its target/base.
2. Write a new plan covering scope/files, dependencies, data/state changes, UI/UX, stable React keys and DOM automation boundaries, accessibility, risks, acceptance criteria, and predecessor links.
3. Obtain explicit user approval of that written plan. No implementation or automated tests before approval.
4. Append an approved entry to the module task ledger with ID, date, branch/base, plan link, approval reference and status. Ensure the section test plan exists.
5. Write and run failing tests for the planned behavior in the appropriate test/module directories. Confirm the expected red reason.
6. Implement the smallest complete change that makes the tests pass; refactor while green. Apply domain keys and semantic/test lookup boundaries to materially changed interactive/repeated UI.
7. Run formatting, type checking, zero-warning lint, full tests and applicable migration/build/browser checks. Store logs only in verified-ignored evidence. Screenshots require an explicit request.
8. Update only this task's new ledger section with results, risks, status and evidence paths. Preserve all inherited sections.
9. When explicitly authorized, push and open a PR. A separate explicit request is required to launch a review. Merge only after review approval and merge authorization.

### Bug fixes

1. Create the bugfix branch and record its target/base.
2. Write a new plan with reproduction, root cause, blast radius, related behavior, proposed fix, affected UI lookup/accessibility boundaries, acceptance tests and predecessor links.
3. Obtain explicit user approval of the written plan.
4. Append the approved module task entry and ensure a section test plan exists.
5. Write a regression test that fails for the reported behavior; run and record the expected failure before changing the implementation.
6. Make the minimal scoped fix, preserving tests and unrelated behavior. Apply React key and accessibility requirements when UI changes.
7. Run formatting, type checking, zero-warning lint, full tests and applicable production-build/database/browser checks. Keep evidence ignored; screenshots are opt-in.
8. Mark this task's new entry fixed only after verification, with root cause and results. Use a successor entry for later fixes.
9. Push/open a PR only when authorized; obtain a separately requested review before an authorized merge.

### Testing

1. Create the testing branch and record its target/base.
2. Write a new task plan and append a section test-plan entry covering unit/component/integration/browser scope, behavior coverage, edge/failure cases, fixtures, mocks and disposable database/browser requirements.
3. Obtain explicit user approval before writing tests.
4. Append the approved module task-ledger entry.
5. Write tests first. Where implementation is missing or buggy, confirm the expected behavioral failure before modifying product code.
6. Keep tests module-wise and type-separated. Preserve existing assertions. Any required implementation change stays within the approved scope or needs a successor plan.
7. Run formatting, type checking, zero-warning lint, the full suite and relevant integration/browser/build gates. Record genuine infrastructure blocks separately from test results.
8. Record results and coverage in the new task and test-plan sections only.
9. Push/open a PR only when authorized; do not merge directly to main. Review remains a separate explicitly requested action and a merge gate.

### 7a. No workflow shortcuts

Zero implementation edits are permitted until all three have happened, in this order:

1. A new task plan is written.
2. The user explicitly approves that written plan in the conversation.
3. The approved task entry exists in the module ledger.

Then TDD begins: write and confirm the failing behavior test before the fix. Planning artifacts themselves are prepared in the planning phase; a proposed registry is not an approved implementation ledger.

No exceptions for a one-line fix, local change, urgency, cosmetic/config/doc work, known root cause, predicted green tests, or a user message that describes implementation. A previous violation does not authorize another. New decisions and corrections receive new plans/entries with lineage. If unclear whether a request is implementation work, ask before skipping the workflow.

## 8. Code review is user-triggered only

- Never invoke a PR-review skill, spawn a reviewer, or write a review report unless the current user request explicitly asks to review/audit a PR, branch, diff or WIP.
- Completing work, passing tests, committing, opening a PR or asking whether work is ready does not authorize review.
- Each explicit request authorizes one review run. Another round requires another explicit request. Posting comments to GitHub separately requires explicit authorization.
- If present, follow `/Users/pranav/Pranav_projects/github/no-brainy/.claude/skills/pr-review/SKILL.md` and its rubric/template. If missing, locate the requested procedure or explain the missing dependency before proceeding; do not fabricate a review outcome.
- Authorized reports grade Critical / Warning / Suggestion across technical, functional and architectural concerns, run applicable gates, and remain under `/Users/pranav/Pranav_projects/github/no-brainy/evidences/reviews/<target>/` with per-target history. Never commit reports.
- Keep any review knowledge-base update subject to user-approved commits. Do not create a review skill or install extra plugins merely because this workflow mentions them.
~~~~
