# NB-12 — Preserve and integrate Library and Life modules

Date: 2026-10-16 (Asia/Kolkata)
Status: APPROVED on 2026-10-16; implementation results are recorded in the task ledger.
Task branch: `feature/library-preserve-and-integrate`
Target/base SHA: Record immediately before implementation; intended to stack on completed dependencies without merging to main.
Future approved task ledger: `/Users/pranav/Pranav_projects/github/no-brainy/docs/tasks/library.md`
Section test plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/library.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/library.md>)
Package: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md>)

## Predecessors, KT and behavioral delta

No historical module task plan exists at baseline `01845cfa639f843dfb59f87558acc176338bb4c8`. Existing specifications are background history, not proof of completion. The following package plans are dependencies/predecessors; preserve their inherited records. This task changes only the behavior described below:

- NB-04: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/design/personal-workspace.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/design/personal-workspace.md>)
- NB-09: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/growth/practice-and-evidence.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/growth/practice-and-evidence.md>)
- NB-10: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/reviews/reflection-to-action.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/reviews/reflection-to-action.md>)

Apply NB-04 design primitives consistently to the existing modules and connect them to NB-09 learning and NB-10 reflection. This task protects and integrates existing capabilities rather than rewriting their storage or specialized algorithms.

KT and source references:
- [/Users/pranav/Pranav_projects/github/no-brainy/README.md](</Users/pranav/Pranav_projects/github/no-brainy/README.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE3_SPEC.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE3_SPEC.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE4_SPEC.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE4_SPEC.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/STABILITY_SPRINTS.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/STABILITY_SPRINTS.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/MODULAR_ARCHITECTURE_SPEC.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/MODULAR_ARCHITECTURE_SPEC.md>)

## Scope and implementation sequence after approval

- Build a Library entrypoint with Notes, Books, Flashcards and saved references; surface Life utilities including finance, media and Stash through clear secondary navigation.
- Preserve notes Markdown, code, Mermaid, wiki links/backlinks, graphs, tags, trash, shortcuts and export; replace inconsistent chrome and failure states without replacing the editor.
- Preserve reading progress, quotes, application notes, manual/AI flashcard drafts, SM-2 reviews, quiz scores and source links. Link relevant learning actions to Growth.
- Preserve Decimal/INR finance semantics, category ownership, import preview and deduplication, budgets and financial goals. Restyle charts/tables responsively without corrupting numerical meaning.
- Preserve bookmarks, watchlist import/metadata and Stash file/encrypted-message behavior. Third-party/storage errors are honest and do not block unrelated modules.
- Provide consistent errors, loading, empty states, search navigation, settings and notifications across modules. Preserve old URLs and navigation preferences.
- Keep modules using the existing data/API contracts; add only narrowly needed connections with explicit ownership validation.

## Affected files and module boundaries

Existing paths below are inspection/implementation targets; not-yet-existing paths are proposed additions. Keep helpers in feature-specific source locations and avoid unrelated restructuring.

- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/library/page.tsx`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/notes`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/books`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/flashcards`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/expenses`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/budgets`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/bookmarks`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/watchlist`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/stash`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/search`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/analytics`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/settings`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/library`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/library`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/library`

## Dependencies and data/state changes

No wholesale data migration. Retain existing specialized models and link/source IDs. New Growth connections use NB-09 owned relations; no duplication/import of all existing content.

Reuse the existing application stack and NB-02's explicitly approved test/development tools. No additional runtime library, external service, account change or cloud action is approved by this plan. Preserve authenticated-owner boundaries, current API envelopes and server/client separation. Schema migrations, where specified, are additive and validated against a populated disposable baseline.

## UI, automation and accessibility

Shared tokens unify backgrounds, headers, inputs, panels and transitions. Dense data tables scroll within their region on mobile. Preserve selection/caret position in editors. Repeated entities use stable IDs; test semantic actions rather than arbitrary styling classes.

Use stable domain identifiers for React keys; use role/name/label locators first and stable data-testid values at meaningful boundaries where needed. No localized text/random value is used as a React key or test ID. New/reworked UI gets loading, empty, error and retry states. Honor user motion preferences. Screenshots are not required or automatically created.

## TDD acceptance cases

- **NB-12-T01 (component):** Note editing/rendering, wiki-link navigation and save/error status continue to work under the new shell.
- **NB-12-T02 (integration):** Flashcard review schedules and quiz results remain correct after shared UI changes.
- **NB-12-T03 (integration):** Expense preview/import preserves INR decimals and duplicate handling; foreign categories are rejected.
- **NB-12-T04 (component):** Stash encrypted messages/file failures remain correctly represented; changing navigation does not expose sensitive content.
- **NB-12-T05 (e2e):** Library and Life destinations, including Flashcards, are reachable on desktop and narrow viewports.
- **NB-12-T06 (e2e):** A cross-module journey from book application to task, focus and reflection preserves source links.

Before automated tests: obtain approval, create the named task branch, record base SHA, append this task's approved entry to the module ledger, and confirm the linked section test plan exists. Write the relevant tests and run them against the pre-change behavior. Record the expected behavioral red result before implementation; missing dependencies/database/browsers do not qualify as red. For acceptance tests of already-implemented behavior, record a genuine initial pass rather than manufacturing a failure; any required fix follows a failing regression and the approved scope.

Implement in small red/green/refactor slices. Targeted commands use the module directory under `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/component/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/` or `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/` according to the case type. NB-02 provides the executable scripts. Do not report a command as passing before it exists and runs.

## Risks, choices and external prerequisites

This is a broad visual integration surface. Tests focus on preserved user outcomes and numerical/data contracts rather than snapshots. No real external storage/metadata call is fabricated when credentials are absent; record optional integration verification separately.

The product choices in this plan are proposed rulings covered by approval of this named task. Unavailable infrastructure remains an explicit blocker to its associated gate; it never justifies silently dropping scope or replacing the stack. Any material expansion requires a successor plan/approval.

## Verification and completion record

Required: formatting of changed code/current docs, TypeScript, ESLint with zero warnings/errors, the full existing/new unit/component suite, affected database/browser suites, Prisma validation for schema changes, and the integrated production build. Never weaken tests/config to pass. Store actual red/green logs in `/Users/pranav/Pranav_projects/github/no-brainy/evidences/library/preserve-and-integrate/` only after Git ignoring is verified.

Results: NOT RUN. Approval: Owner’s 2026-10-16 conversation message “approved.” covers this named plan and the dependencies explicitly listed in NB-02. Implementation: NOT STARTED. Update only this task's newly introduced ledger section with outcomes before landing. Push/PR/review/merge/deployment remain separate authorization gates.
