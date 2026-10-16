# AI task ledger

## NB-11 — Optional contextual assistance

- Date: 2026-10-16 (Asia/Kolkata).
- Branch: `feature/ai-contextual-assistance`.
- Target/base: `feature/reviews-reflection-to-action`, `ca65960e17b04898de3074d70f18f61e34309237`.
- Approved plan: /Users/pranav/Pranav_projects/github/no-brainy/docs/plans/ai/contextual-assistance.md.
- Approval: Owner's 2026-10-16 “approved.” includes this written plan; routine choices delegated.
- Status: COMPLETE locally — not pushed or merged.
- Scope: Bounded sourced context, validated optional suggestions, at most three resolvable active priorities, editable previews and explicit acceptance, neutral observations, private provider failures and manual fallbacks.
- Decisions: Calendar ranges include both selected days in the account timezone; current goal/budget state is labeled as a snapshot. Historical activity is bounded independently. Use existing insight related IDs, with validated references and date-window labels. Do not infer causes or health state from unrelated activity. Retain provider/model selection. Preview acceptance remains a deliberate user action; model calls never schedule work directly. Automated provider responses are mocked; no paid requests.
- TDD: Initial database tests rejected nine old behaviors (unbounded activity, duplicate/absent/foreign IDs, missing capacity/source context, unsafe insight replacement, stale review counters and invalid chat roles). UI regressions failed for editable planning, unresolved IDs, source-preserving action retries, raw HTML rendering and completion announcements. Additional finance regressions failed for future records and private provider logging; edited action priority and separate goal measurement context were also confirmed red before fixes.
- Delivery: Validated structured outputs for planning, prioritization, review, note/book extraction, summaries, tags, cards and insight generation. Insights validate source IDs before a single transactional replacement. Source actions reuse owned idempotent Growth creation. Coach announces completion, uses stable message IDs, and keeps raw provider errors private. Finance observations use bounded context with exact recorded amounts. Provider/model choices are preserved; requests have a 30-second timeout.
- Verification: `npm test` passed 23 governance and 103 unit/component tests; `npm run test:integration` passed 48 tests; `npm run test:e2e` passed 12 browser journeys. Formatting, TypeScript and production build passed. ESLint has zero errors and the same four inherited image warnings assigned to NB-12. No schema migration was needed.
- Evidence: /Users/pranav/Pranav_projects/github/no-brainy/evidences/ai/contextual-assistance/ (ignored), including api-red.log, component-red.log, actions-red.log, insight-red.log, coach-red.log, finance-context-red.log, finance-privacy-red.log, full-unit.log, full-integration.log, full-browser.log, types-final.log, format-check.log, build.log and lint.log.
- Limits: Provider calls are mocked; live quality/availability was not claimed. Prompts cannot guarantee model judgment, so outputs are previews with explicit user actions and validated references. Aggregations label current state separately from bounded activity. No raw prompts or private credentials are logged or exported.
