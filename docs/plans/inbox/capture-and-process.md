# NB-06 — One Inbox and recoverable capture

Date: 2026-10-16 (Asia/Kolkata)
Status: APPROVED on 2026-10-16; implementation results are recorded in the task ledger.
Task branch: `feature/inbox-capture-and-process`
Target/base SHA: Record immediately before implementation; intended to stack on completed dependencies without merging to main.
Future approved task ledger: `/Users/pranav/Pranav_projects/github/no-brainy/docs/tasks/inbox.md`
Section test plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/inbox.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/inbox.md>)
Package: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md>)

## Predecessors, KT and behavioral delta

No historical module task plan exists at baseline `01845cfa639f843dfb59f87558acc176338bb4c8`. Existing specifications are background history, not proof of completion. The following package plans are dependencies/predecessors; preserve their inherited records. This task changes only the behavior described below:

- NB-04: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/design/personal-workspace.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/design/personal-workspace.md>)
- NB-05: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/projects/outcomes-and-routines.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/projects/outcomes-and-routines.md>)

Evolve the existing type-first capture modal into immediate text/link capture with later processing, using NB-04 shared UI and NB-05 task/project relations. Stash and existing notes remain intact and accessible.

KT and source references:
- [/Users/pranav/Pranav_projects/github/no-brainy/README.md](</Users/pranav/Pranav_projects/github/no-brainy/README.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/MyFocusHub_PRD.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/MyFocusHub_PRD.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/MODULAR_ARCHITECTURE_SPEC.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/MODULAR_ARCHITECTURE_SPEC.md>)

## Scope and implementation sequence after approval

- Save raw text/link to Inbox without mandatory classification. Keep a fast optional task/note creation path and the existing Cmd/Ctrl+K muscle memory.
- Provide desktop/mobile visible capture controls and allow capture during Focus mode without ending the session.
- Persist unfinished input in a user-scoped browser draft store using native browser APIs. Distinguish draft/pending/server-saved states. Retain failed content and offer explicit retry.
- Process into task, note, bookmark/reference, project-linked action or someday item. Preserve original capture text/source and a backlink to the result.
- Use stable client request IDs and a transactional conversion endpoint so retry/double Enter cannot duplicate destination records or mark a failed conversion processed.
- Support search/filter, archive, accessible next-item processing and undo of a processing status where it does not delete edited destination data.

## Affected files and module boundaries

Existing paths below are inspection/implementation targets; not-yet-existing paths are proposed additions. Keep helpers in feature-specific source locations and avoid unrelated restructuring.

- `/Users/pranav/Pranav_projects/github/no-brainy/prisma/schema.prisma`
- `/Users/pranav/Pranav_projects/github/no-brainy/prisma/migrations`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/types/inbox.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/validations/inbox.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/inbox`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/api/inbox`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/hooks/use-inbox.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components/quick-capture`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components/inbox`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/inbox/page.tsx`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components/layout/app-shell.tsx`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/inbox`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/inbox`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/inbox`

## Dependencies and data/state changes

New user-owned Capture model with content, optional source URL, state, clientRequestId, destination type/ID and timestamps. Conversion is transactional; enforce unique clientRequestId per owner. Local drafts are scoped by owner and have a format version.

Reuse the existing application stack and NB-02's explicitly approved test/development tools. No additional runtime library, external service, account change or cloud action is approved by this plan. Preserve authenticated-owner boundaries, current API envelopes and server/client separation. Schema migrations, where specified, are additive and validated against a populated disposable baseline.

## UI, automation and accessibility

Capture-trigger, capture-input, capture-save and capture-{id} boundaries have semantic labels/stable IDs. Focus returns to the invoking screen. Mobile sheet fits the keyboard and keeps submit/retry reachable.

Use stable domain identifiers for React keys; use role/name/label locators first and stable data-testid values at meaningful boundaries where needed. No localized text/random value is used as a React key or test ID. New/reworked UI gets loading, empty, error and retry states. Honor user motion preferences. Screenshots are not required or automatically created.

## TDD acceptance cases

- **NB-06-T01 (unit):** Draft content survives close/reopen and storage failure becomes a visible recoverable state.
- **NB-06-T02 (integration):** A conversion either saves the destination and capture link together or saves neither.
- **NB-06-T03 (integration):** Double submission and retry of the same client ID return one record.
- **NB-06-T04 (component):** Capture works without choosing a type, shows unsynced state correctly and retains content after failed save.
- **NB-06-T05 (component):** Processing an item preserves its source and links it to the chosen existing project.
- **NB-06-T06 (e2e):** Capture during a running focus session returns to that same session without resetting its timer.

Before automated tests: obtain approval, create the named task branch, record base SHA, append this task's approved entry to the module ledger, and confirm the linked section test plan exists. Write the relevant tests and run them against the pre-change behavior. Record the expected behavioral red result before implementation; missing dependencies/database/browsers do not qualify as red. For acceptance tests of already-implemented behavior, record a genuine initial pass rather than manufacturing a failure; any required fix follows a failing regression and the approved scope.

Implement in small red/green/refactor slices. Targeted commands use the module directory under `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/component/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/` or `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/` according to the case type. NB-02 provides the executable scripts. Do not report a command as passing before it exists and runs.

## Risks, choices and external prerequisites

Local draft persistence must not leak between accounts or falsely claim cloud sync. URL capture uses validated URLs; rich remote metadata is optional and must not block saving. Do not automatically import all Stash content into Inbox.

The product choices in this plan are proposed rulings covered by approval of this named task. Unavailable infrastructure remains an explicit blocker to its associated gate; it never justifies silently dropping scope or replacing the stack. Any material expansion requires a successor plan/approval.

## Verification and completion record

Required: formatting of changed code/current docs, TypeScript, ESLint with zero warnings/errors, the full existing/new unit/component suite, affected database/browser suites, Prisma validation for schema changes, and the integrated production build. Never weaken tests/config to pass. Store actual red/green logs in `/Users/pranav/Pranav_projects/github/no-brainy/evidences/inbox/capture-and-process/` only after Git ignoring is verified.

Results: NOT RUN. Approval: Owner’s 2026-10-16 conversation message “approved.” covers this named plan and the dependencies explicitly listed in NB-02. Implementation: NOT STARTED. Update only this task's newly introduced ledger section with outcomes before landing. Push/PR/review/merge/deployment remain separate authorization gates.
