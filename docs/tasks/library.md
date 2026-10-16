# Library and Life task ledger

## NB-12 — Preserve and integrate existing tools

- Date: 2026-10-16 (Asia/Kolkata).
- Branch: `feature/library-preserve-and-integrate`.
- Target/base: `feature/ai-contextual-assistance`, `5fa7576c09195f671a9f2ed8aa94e313c4749edd`.
- Approved plan: /Users/pranav/Pranav_projects/github/no-brainy/docs/plans/library/preserve-and-integrate.md.
- Approval: Owner's 2026-10-16 “approved.” includes this written plan.
- Status: COMPLETE locally — registered before tests/implementation; no remote operations or review.
- Scope: Consistent Library/Life presentation, reachable navigation, honest read/error states, preserved note/learning/finance/media/Stash contracts, narrow-screen interactions, existing image lint remediation.
- Decisions: Preserve existing editor and specialized models. External cover/favicon images use unoptimized Next Image with fixed dimensions and local failure fallbacks; no new image proxy or package. Existing content remains reachable through old URLs. Imported expense duplicates are identified from exact normalized transaction fields within the same owner and import source; report skipped counts. Core task/goal connections reuse already implemented owned APIs. Optional GCS/metadata calls stay mocked or explicitly unavailable.
- Import identity ruling: include the original transaction reference when present, in addition to owner/source/date/name/amount. Distinct same-day transactions remain distinct; exact file retries report skipped rows.
- Red: collection failure rendered empty; broken cover persisted; bookmark/watchlist controls lacked names; delayed Stash completion/failure affected another channel; expense retries duplicated or collapsed distinct references; flashcard date used process timezone; repeated quiz answers inflated counts; Stash nested main landmarks failed browser lookup. Invalid fixture headers/card fields and a navigation URL timing issue were corrected separately from product failures.
- Green: `npm test` (23 Node + 111 Vitest), `npm run test:integration` (54), `npm run test:e2e` (14), `npm run typecheck`, `npm run lint` (zero warnings), `npm run format:check`, `npx prisma validate`, `npm run build`. All logs under /Users/pranav/Pranav_projects/github/no-brainy/evidences/library/preserve-and-integrate/.
- Limits: external GCS/metadata/AI calls were not made. Preserved Markdown/diagram boundaries use component doubles; real authenticated browser journeys cover navigation, source-to-action, Focus and reflection. No screenshots captured.
