# NB-11 — Optional contextual AI with accurate evidence

Date: 2026-10-16 (Asia/Kolkata)
Status: APPROVED on 2026-10-16; implementation results are recorded in the task ledger.
Task branch: `feature/ai-contextual-assistance`
Target/base SHA: Record immediately before implementation; intended to stack on completed dependencies without merging to main.
Future approved task ledger: `/Users/pranav/Pranav_projects/github/no-brainy/docs/tasks/ai.md`
Section test plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/ai.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/ai.md>)
Package: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/product/personal-growth-rebuild.md>)

## Predecessors, KT and behavioral delta

No historical module task plan exists at baseline `01845cfa639f843dfb59f87558acc176338bb4c8`. Existing specifications are background history, not proof of completion. The following package plans are dependencies/predecessors; preserve their inherited records. This task changes only the behavior described below:

- NB-07: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/planner/today-and-capacity.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/planner/today-and-capacity.md>)
- NB-09: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/growth/practice-and-evidence.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/growth/practice-and-evidence.md>)
- NB-10: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/reviews/reflection-to-action.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/plans/reviews/reflection-to-action.md>)

Keep existing BYOK infrastructure and accepted drafts, but ground suggestions in the actual NB-07 plan, NB-09 outcomes and NB-10 review. Fix date-window/context mismatches and remove unsupported psychological causal examples.

KT and source references:
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE2_SPEC.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE2_SPEC.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE3_SPEC.md](</Users/pranav/Pranav_projects/github/no-brainy/docs/PHASE3_SPEC.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/SECURITY.md](</Users/pranav/Pranav_projects/github/no-brainy/SECURITY.md>)
- [/Users/pranav/Pranav_projects/github/no-brainy/src/lib/ai/insights/aggregate-user-data.ts](</Users/pranav/Pranav_projects/github/no-brainy/src/lib/ai/insights/aggregate-user-data.ts>)
- [/Users/pranav/Pranav_projects/github/no-brainy/src/lib/ai/prompts/insight-generate.ts](</Users/pranav/Pranav_projects/github/no-brainy/src/lib/ai/prompts/insight-generate.ts>)

## Scope and implementation sequence after approval

- Use both date-range bounds, exclude cancelled work from overdue counts, and expose source IDs/dates for observations. Test data selection separately from the model.
- Constrain daily suggestions to at most three owned active task IDs that can all resolve in the UI; account for available time and retain unknown estimates.
- Offer inline processing/next-action/planning/review suggestions with accept/edit/dismiss. No AI mutation applies silently and dismissal leaves user work unchanged.
- Validate structured model output with Zod; reject fabricated/foreign IDs and malformed results. Keep provider/model configuration unchanged unless separately approved.
- Replace speculative diagnoses or moral judgments with neutral observations, uncertainty and a user-chosen experiment. Never infer stress eating or health status from spending/task counts.
- Mock provider responses for all automated tests. Verify no-key, timeout, invalid-key and unavailable-provider states keep all core manual flows working and never disclose secrets.

## Affected files and module boundaries

Existing paths below are inspection/implementation targets; not-yet-existing paths are proposed additions. Keep helpers in feature-specific source locations and avoid unrelated restructuring.

- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/ai/prompts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/ai/insights/aggregate-user-data.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/lib/ai/types.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/api/planner/ai/suggest/route.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/app/api/ai/coach/route.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components/ai`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/components/planner/ai-suggest-panel.tsx`
- `/Users/pranav/Pranav_projects/github/no-brainy/src/hooks/use-ai-action.ts`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/ai`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/ai`
- `/Users/pranav/Pranav_projects/github/no-brainy/test/component/ai`

## Dependencies and data/state changes

Reuse Insight and existing accepted AI fields. Add optional typed source references if required through a small additive migration; do not log raw private prompts or export API keys. No model-provider or production dependency migration is proposed.

Reuse the existing application stack and NB-02's explicitly approved test/development tools. No additional runtime library, external service, account change or cloud action is approved by this plan. Preserve authenticated-owner boundaries, current API envelopes and server/client separation. Schema migrations, where specified, are additive and validated against a populated disposable baseline.

## UI, automation and accessibility

Use a compact contextual suggestion panel with evidence references and explicit accept/edit/dismiss. Preserve task order and drafts on rejection. Streamed coach text announces useful completion rather than every token.

Use stable domain identifiers for React keys; use role/name/label locators first and stable data-testid values at meaningful boundaries where needed. No localized text/random value is used as a React key or test ID. New/reworked UI gets loading, empty, error and retry states. Honor user motion preferences. Screenshots are not required or automatically created.

## TDD acceptance cases

- **NB-11-T01 (unit):** Aggregation excludes records beyond either range boundary and filters cancelled overdue tasks.
- **NB-11-T02 (unit):** Suggestion validation rejects more than three, duplicate, absent or foreign task IDs.
- **NB-11-T03 (integration):** Mocked malformed/failed AI responses become actionable errors without saving partial changes.
- **NB-11-T04 (component):** Accept/edit/dismiss preview works and core planning remains available with no AI key.
- **NB-11-T05 (component):** Every suggested task resolves to its actual title and source; missing evidence is not invented.
- **NB-11-T06 (integration):** Private keys remain server-only and absent from response/log fixtures.

Before automated tests: obtain approval, create the named task branch, record base SHA, append this task's approved entry to the module ledger, and confirm the linked section test plan exists. Write the relevant tests and run them against the pre-change behavior. Record the expected behavioral red result before implementation; missing dependencies/database/browsers do not qualify as red. For acceptance tests of already-implemented behavior, record a genuine initial pass rather than manufacturing a failure; any required fix follows a failing regression and the approved scope.

Implement in small red/green/refactor slices. Targeted commands use the module directory under `/Users/pranav/Pranav_projects/github/no-brainy/test/unit/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/component/`, `/Users/pranav/Pranav_projects/github/no-brainy/test/integration/` or `/Users/pranav/Pranav_projects/github/no-brainy/test/e2e/` according to the case type. NB-02 provides the executable scripts. Do not report a command as passing before it exists and runs.

## Risks, choices and external prerequisites

Prompt tests cannot prove model behavior. Combine deterministic data/output validation with mocked interaction tests and transparent source/uncertainty UI. No live paid AI call is required for the test suite.

The product choices in this plan are proposed rulings covered by approval of this named task. Unavailable infrastructure remains an explicit blocker to its associated gate; it never justifies silently dropping scope or replacing the stack. Any material expansion requires a successor plan/approval.

## Verification and completion record

Required: formatting of changed code/current docs, TypeScript, ESLint with zero warnings/errors, the full existing/new unit/component suite, affected database/browser suites, Prisma validation for schema changes, and the integrated production build. Never weaken tests/config to pass. Store actual red/green logs in `/Users/pranav/Pranav_projects/github/no-brainy/evidences/ai/contextual-assistance/` only after Git ignoring is verified.

Results: NOT RUN. Approval: Owner’s 2026-10-16 conversation message “approved.” covers this named plan and the dependencies explicitly listed in NB-02. Implementation: NOT STARTED. Update only this task's newly introduced ledger section with outcomes before landing. Push/PR/review/merge/deployment remain separate authorization gates.
