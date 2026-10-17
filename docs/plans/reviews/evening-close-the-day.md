# T07 — Evening close-the-day with tomorrow handoff

**Module:** reviews · **Date:** 2026-10-16 · **Branch:** `feature/platform-daily-loop-overhaul` · **Ledger:** [docs/tasks/reviews.md](../../tasks/reviews.md)

## Summary

The nightly review computes stats and stores a reflection, then nothing happens with it. This task turns it into a short guided close-the-day flow that ends with one intent for tomorrow, and writes that intent into tomorrow's plan so the loop closes.

## Predecessors

No plan exists for `src/app/api/reviews/**` or `src/app/(dashboard)/reviews/**`. Delta: `DailyReview` gains `tomorrowIntent`; the daily page becomes a stepped flow; day boundaries use T03 helpers; saving upserts tomorrow's `DayPlan.intentMd`.

## Scope and affected files

- `prisma/schema.prisma`: `DailyReview.tomorrowIntent String?`; migration `add_review_tomorrow_intent`
- `src/app/api/reviews/daily/route.ts`, `src/app/api/reviews/daily/[date]/route.ts`: accept and return `tomorrowIntent`; on update with `tomorrowIntent`, upsert `DayPlan` for `date + 1` setting `intentMd` (only if that plan's `intentMd` is empty or equals the previous intent); stats use `dayBoundsUtc`; `tasksMissed` counts tasks due that day left incomplete; add `focusMinutes` to the response computed from focus sessions when T10 lands (nullable until then)
- `src/lib/validations/reviews.ts`, `src/lib/types/reviews.ts`
- `src/components/reviews/close-day-flow.tsx` (new): steps Stats → Reflect (three prompts: went well, got stuck, learned; stored as markdown headings in `reflectionMd`) → Mood → Tomorrow (single line, required to finish) → Done (confetti-free, a calm checkmark and streak count)
- `src/app/(dashboard)/reviews/daily/page.tsx`: hosts the flow; `?date=` param for past days; existing reviews open in edit mode
- `src/app/(dashboard)/reviews/page.tsx`: today's card shows the intent; cards animate in with stagger
- `src/hooks/use-reviews.ts`: `useUpsertReview(date)` combining create and update

## Dependencies

T02, T03.

## Data model / state changes

`daily_reviews.tomorrow_intent` nullable text.

## UI/UX

- Step transitions slide horizontally 24 px with fade; progress dots at the top.
- The Tomorrow step is the only required field besides mood; the finish button reads "Close the day".
- After finishing, a single toast offers "View tomorrow's plan".

## Test-id strategy and accessibility

`close-day-step-${name}`, `close-day-next`, `close-day-finish`, `tomorrow-intent-input`, `mood-${value}`. Steps are a `role="group"` with `aria-labelledby`.

## Test plan

[docs/test-plans/reviews.md](../../test-plans/reviews.md) §T07.

## Risks and open questions

- Overwriting an intent the user already typed into tomorrow's plan. **Ruling applied:** only fill when empty or unchanged from the previous handoff.
