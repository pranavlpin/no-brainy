# T19 — Growth: success criteria, measurements, practice target, evidence, book experiments

**Module:** goals · **Date:** 2026-10-16 · **Branch:** `feature/product-adoption-wave-2` · **Ledger:** [docs/tasks/goals.md](../../tasks/goals.md) · **Package:** [acceptance-branch-adoption.md](../product/acceptance-branch-adoption.md)

## Summary

Goals describe what success looks like, optionally measure it, set a weekly practice target, and keep dated evidence with sources. Task completion and demonstrated progress are shown separately. Rest and skips are recorded without penalty. A book's application note can become a sourced experiment.

## Predecessors

- [today-cockpit.md](../home/today-cockpit.md) (T05): goals pulse. Delta: shows practice this week against target.
- [morning-triage-and-intent.md](../planner/morning-triage-and-intent.md) (T06): goal chips. Unchanged.
- Ported, credited: `GrowthEvidence`, goal fields, evidence form, source picker, and book experiment from `test/product-final-acceptance` (NB-09).

## Scope and affected files

- `prisma/schema.prisma`: `Goal.successCriteria`, `baseline`, `target`, `unit`, `weeklyPracticeTarget`; `GrowthEvidence` model; migration `add_growth_evidence`
- `src/lib/growth/progress.ts` (outcome percent, week practice count with dedupe), `src/lib/validations/growth.ts`, `src/lib/types/growth.ts`
- `src/app/api/goals/route.ts`, `[id]/route.ts` (new fields, measurement, practice and evidence counts), `src/app/api/growth/evidence/route.ts`, `[id]/route.ts`, `src/app/api/growth/sources/route.ts`
- `src/hooks/use-growth.ts`, `src/hooks/use-goals.ts`
- `src/components/goals/goal-form.tsx`, `goal-card.tsx`, `src/components/growth/evidence-form.tsx`, `source-picker.tsx`, `book-experiment.tsx`, `practice-card.tsx`
- `src/app/(dashboard)/goals/page.tsx`, `[id]/page.tsx`, `src/app/(dashboard)/books/[id]/page.tsx`
- `src/app/api/home/route.ts`, `src/components/home/goals-pulse.tsx`

## Data model / state changes

Additive goal columns; new table `growth_evidence` with unique `(userId, clientRequestId)`.

## UI/UX

Goal detail: success card with measurement, practice card with week navigation and Log practice / Rest / Skip, next actions with Focus and Plan today, evidence list with correct and remove. Numbers animate; progress bars spring.

## Test-id strategy and accessibility

`goal-measurement`, `goal-practice`, `goal-next-action`, `evidence-${id}`, `book-experiment-${id}`.

## Test plan

[docs/test-plans/goals.md](../../test-plans/goals.md) §T19.

## Risks and open questions

- Financial goals keep their amount semantics; the measurement formula does not apply to them. **Ruling applied.**

## Refinements (while the branch was open)

- Practice is counted in distinct local days (practice evidence plus completed or progress focus sessions on the goal's tasks); the acceptance branch's routine identities do not exist here, so day-level deduplication is the honest unit.
- The goal routes now share one serializer (`src/lib/goals/serialize.ts`) and compute practice for a whole list in two queries instead of per goal.
- Evidence sources are snapshotted by title and linked by type and id without a per-item lookup; a session source carries the local day it ended so practice dates line up.
- The practice card shows the current local week; week navigation is deferred to the weekly review (T20), which is the natural place to look back.
- A book experiment is an ordinary task tagged `experiment` with the book cited in its description and an optional goal; it needs no separate endpoint.
- Home's goal pulse shows the measured outcome when a goal is measured, otherwise task progress, plus a practice chip against the weekly target.
