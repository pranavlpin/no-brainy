# NB-04 — Full personal workspace design system and navigation

Date: 2026-10-16 (Asia/Kolkata)
Status: APPROVED on 2026-10-16; implementation results are recorded in the task ledger.
Task branch: `feature/design-personal-workspace`
Target/base SHA: Record immediately before implementation; intended to stack on completed dependencies without merging to main.
Future approved task ledger: `/Users/pranav/Pranav_projects/github/no-brainy/docs/tasks/design.md`
Section test plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/design.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/design.md>)
Package: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md>)

## Predecessors, KT and behavioral delta

No historical module task plan exists at baseline `01845cfa639f843dfb59f87558acc176338bb4c8`. Existing specifications are background history, not proof of completion. The following package plans are dependencies/predecessors; preserve their inherited records. This task changes only the behavior described below:

- NB-03: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/tasks/persistence-and-discovery.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/tasks/persistence-and-discovery.md>)

Replace inconsistent retro/light-only surfaces with coherent, theme-aware UI and meaningful transitions while preserving existing modules and navigation preferences. Resolve the entrypoint ambiguity by testing route behavior. Extend NB-03 save feedback through shared primitives.

KT and source references:
- [/Users/pranav/Pranav_projects/github/no-brainy/README.md](</Users/pranav/Pranav_projects/github/no-brainy/README.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/STABILITY_SPRINTS.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/STABILITY_SPRINTS.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/MODULAR_ARCHITECTURE_SPEC.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/MODULAR_ARCHITECTURE_SPEC.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/TECHNICAL_SPEC.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/TECHNICAL_SPEC.md>)

## Scope and implementation sequence after approval

- Introduce named semantic surface/color/spacing/type/motion tokens, warm neutral backgrounds, restrained gradients, soft elevation, clear hierarchy and a full dark appearance. Use system/font fallbacks that do not block startup if remote fonts are unavailable.
- Build responsive desktop navigation and mobile primary controls around Today, Inbox, Projects, Growth and Library; keep Tasks and existing Life utilities easy to reach. Add a visible capture action and Work/Personal/All context. Preserve legacy deep links.
- Reconcile existing theme/custom theme and hidden/reordered navigation preferences through a versioned migration with recoverable defaults, rather than discarding settings.
- Use native CSS transitions for small feedback, panels, tab state and focus mode. Prefer transform/opacity, avoid animation that delays input, and respect reduced motion across all new surfaces.
- Upgrade dialog/drawer primitives for focus placement/trap/return, Escape behavior, semantic labels and mobile bounds. Provide stable skeleton, empty, loading, retry and toast patterns.
- Make authenticated startup land on Today once NB-07 supplies it. Until then retain a working existing planner destination; never expose a dead navigation link. Keep login/registration normal and private data protected.

## Affected files and module boundaries

Existing paths below are inspection/implementation targets; not-yet-existing paths are proposed additions. Keep helpers in feature-specific source locations and avoid unrelated restructuring.

- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/globals.css`
- `/Users/pranav/Pranav_projects/github/no-brainy/tailwind.config.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components/ui`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components/layout`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/stores/ui-store.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/stores/theme-store.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/stores/dark-mode-store.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components/auth`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/page.tsx`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/page.tsx`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/middleware.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/design`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/design`

## Dependencies and data/state changes

Only versioned user interface preferences/navigation state change here. No duplicate server state store or schema migration. Later module tasks populate new destinations incrementally.

Reuse the existing application stack and NB-02's explicitly approved test/development tools. No additional runtime library, external service, account change or cloud action is approved by this plan. Preserve authenticated-owner boundaries, current API envelopes and server/client separation. Schema migrations, where specified, are additive and validated against a populated disposable baseline.

## UI, automation and accessibility

React keys use domain IDs. Meaningful lookup boundaries include app-shell, primary-navigation, capture-trigger, task-drawer and dialog controls. Roles/labels remain the primary accessibility contract. Validate 360, 768 and 1440 px layouts, keyboard operation and reduced motion without requiring screenshots.

Use stable domain identifiers for React keys; use role/name/label locators first and stable data-testid values at meaningful boundaries where needed. No localized text/random value is used as a React key or test ID. New/reworked UI gets loading, empty, error and retry states. Honor user motion preferences. Screenshots are not required or automatically created.

## TDD acceptance cases

- **NB-04-T01 (component):** Dialog opens at the correct focus target, contains Tab navigation, closes with Escape and restores focus.
- **NB-04-T02 (component):** Saved navigation/theme preferences migrate without losing access to existing modules, including Flashcards.
- **NB-04-T03 (component):** Capture and essential navigation are reachable without hover on a narrow touch layout.
- **NB-04-T04 (e2e):** All primary/legacy destinations resolve without route collisions or unauthorized content exposure.
- **NB-04-T05 (e2e):** Dark/light/reduced-motion settings persist after reload; layout has no document-wide horizontal overflow at the specified widths.

Before automated tests: obtain approval, create the named task branch, record base SHA, append this task's approved entry to the module ledger, and confirm the linked section test plan exists. Write the relevant tests and run them against the pre-change behavior. Record the expected behavioral red result before implementation; missing dependencies/database/browsers do not qualify as red. For acceptance tests of already-implemented behavior, record a genuine initial pass rather than manufacturing a failure; any required fix follows a failing regression and the approved scope.

Implement in small red/green/refactor slices. Targeted commands use the module directory under `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/component/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/` or `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/` according to the case type. NB-02 provides the executable scripts. Do not report a command as passing before it exists and runs.

## Risks, choices and external prerequisites

Shared tokens affect every module. Stage replacement through semantic aliases and module regression checks. Do not add animation/UI libraries; defer module-specific redesigns to NB-12. Appearance performance must be measured in a running browser, not inferred from CSS.

The product choices in this plan are proposed rulings covered by approval of this named task. Unavailable infrastructure remains an explicit blocker to its associated gate; it never justifies silently dropping scope or replacing the stack. Any material expansion requires a successor plan/approval.

## Verification and completion record

Required: formatting of changed code/current docs, TypeScript, ESLint with zero warnings/errors, the full existing/new unit/component suite, affected database/browser suites, Prisma validation for schema changes, and the integrated production build. Never weaken tests/config to pass. Store actual red/green logs in `/Users/pranav/Pranav_projects/github/no-brainy/evidences/design/personal-workspace/` only after Git ignoring is verified.

Results: NOT RUN. Approval: Owner’s 2026-10-16 conversation message “approved.” covers this named plan and the dependencies explicitly listed in NB-02. Implementation: NOT STARTED. Update only this task's newly introduced ledger section with outcomes before landing. Push/PR/review/merge/deployment remain separate authorization gates.
