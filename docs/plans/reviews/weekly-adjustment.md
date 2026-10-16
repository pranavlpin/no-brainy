# T20 — Weekly review: Stop / Keep / Try, next-week outcomes, next week's first action

**Module:** reviews · **Date:** 2026-10-16 · **Branch:** `feature/product-adoption-wave-2` · **Ledger:** [docs/tasks/reviews.md](../../tasks/reviews.md) · **Package:** [acceptance-branch-adoption.md](../product/acceptance-branch-adoption.md)

## Summary

A weekly adjustment keyed by Monday: the week's activity and practice, one Stop / Keep / Try experiment, up to three next-week outcomes, and next week's first action planned onto Monday. Saves through draft-save with explicit state.

## Predecessors

- [evening-close-the-day.md](./evening-close-the-day.md) (T07). Delta: the reviews index gains the weekly card; the daily flow is unchanged.
- Ported, credited: `WeeklyReview` and the weekly editor from `test/product-final-acceptance` (NB-10).

## Scope and affected files

- `prisma/schema.prisma`: `WeeklyReview` model; migration `add_weekly_reviews`
- `src/lib/reviews/weeks.ts` (`weekStartFor`), `src/lib/validations/reviews.ts`, `src/lib/types/reviews.ts`
- `src/app/api/reviews/weekly/[weekStart]/route.ts` (get-or-create, update with handoff of `nextTaskId` → `plannedDate` Monday)
- `src/hooks/use-reviews.ts`
- `src/components/reviews/weekly-editor.tsx`, `src/app/(dashboard)/reviews/weekly/page.tsx`, `src/app/(dashboard)/reviews/page.tsx`
- `src/app/api/home/route.ts`, `src/components/home/hero.tsx` (weekend "Adjust the week" call when not done)

## Data model / state changes

New table `weekly_reviews` unique on `(userId, weekStart)`.

## UI/UX

Activity summary at the top (reuses the existing weekly stats), goals and practice grid, three short fields, three outcome lines, action picker, Save weekly adjustment.

## Test-id strategy and accessibility

`weekly-review-${weekStart}`, `week-stop`, `week-keep`, `week-try`, `week-outcome-${n}`, `week-next-action`.

## Test plan

[docs/test-plans/reviews.md](../../test-plans/reviews.md) §T20.

## Risks and open questions

- Only Mondays are valid week keys; other dates redirect to their Monday. **Ruling applied.**
