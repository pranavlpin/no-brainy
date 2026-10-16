# Library and Life task ledger

## NB-12 — Preserve and integrate existing tools

- Date: 2026-10-16 (Asia/Kolkata).
- Branch: `feature/library-preserve-and-integrate`.
- Target/base: `feature/ai-contextual-assistance`, `5fa7576c09195f671a9f2ed8aa94e313c4749edd`.
- Approved plan: /Users/pranav/Pranav_projects/github/no-brainy/docs/plans/library/preserve-and-integrate.md.
- Approval: Owner's 2026-10-16 “approved.” includes this written plan.
- Status: IN PROGRESS — registered before tests/implementation.
- Scope: Consistent Library/Life presentation, reachable navigation, honest read/error states, preserved note/learning/finance/media/Stash contracts, narrow-screen interactions, existing image lint remediation.
- Decisions: Preserve existing editor and specialized models. External cover/favicon images use unoptimized Next Image with fixed dimensions and local failure fallbacks; no new image proxy or package. Existing content remains reachable through old URLs. Imported expense duplicates are identified from exact normalized transaction fields within the same owner and import source; report skipped counts. Core task/goal connections reuse already implemented owned APIs. Optional GCS/metadata calls stay mocked or explicitly unavailable.
- Verification: Pending red/green. Existing four image lint warnings are part of this task.
