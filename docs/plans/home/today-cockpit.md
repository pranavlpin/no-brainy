# T05 — Today cockpit as the app home

**Module:** home · **Date:** 2026-10-16 · **Branch:** `feature/platform-daily-loop-overhaul` · **Ledger:** [docs/tasks/home.md](../../tasks/home.md)

## Summary

Login currently lands on Notes and the dashboard index re-exports the marketing page. This task makes `/` a Today cockpit that fuses the plan, the intent, due learning, goal pulse, and the evening close-out into one screen, and moves the marketing page to `/welcome`.

## Predecessors

No plan exists for the landing or dashboard index. Delta: `/` becomes the authenticated home; marketing moves to `/welcome`; login and OAuth callbacks redirect to `/`.

## Scope and affected files

- `src/app/welcome/page.tsx` (moved from `src/app/page.tsx`, content unchanged except internal links)
- `src/app/page.tsx`: removed; `src/app/(dashboard)/page.tsx` becomes the Today page
- `src/middleware.ts`: protect `/` and all dashboard routes; unauthenticated `/` → `/welcome`; matcher gains `/`, `/stash`, `/expenses`, `/budgets`, `/bookmarks`, `/watchlist`, `/insights`, `/ai`, `/notifications`
- `src/components/auth/login-form.tsx`, `register-form.tsx`, `google-button.tsx`: redirect to `/`
- `src/app/api/home/route.ts` (new): one aggregated `GET` returning `{ today, greetingName, plan (focus, due, intentMd, carryForwardCount), review: { todayDone, yesterday: { mood, tomorrowIntent } }, learn: { cardsDue, decksDue[], currentlyReading[] }, goals: { active[] with lastActivityAt, staleCount }, streaks: { review }, overdueCount, focusMinutesToday }`
- `src/hooks/use-home.ts` (new)
- `src/components/home/` (new): `hero.tsx` (time-of-day greeting, date, streak), `intent-card.tsx` (reuses planner's), `focus-card.tsx`, `due-today-card.tsx`, `learn-card.tsx`, `goals-pulse.tsx`, `capture-inline.tsx`, `close-day-cta.tsx`, `morning-cta.tsx`
- `src/app/(dashboard)/page.tsx`: responsive grid; morning state (no focus chosen) shows a "Plan the day" card linking into planner triage; evening state (after 18:00 local, or when all focus done) raises the close-day card; completed day shows the review summary

## Dependencies

T02, T03, T04, T06, T07. Deck due counts come from existing deck queries.

## Data model / state changes

None beyond T06 and T07. Query key `['home']`, refetch on window focus, invalidated by task, plan, review mutations.

## UI/UX

- Staggered card entrance (40 ms per card); animated number for cards due and streak; focus toggles reuse the T04 check.
- Hero copy: "Good morning, Pranav" style using the account name; subtitle shows the date and the intent when set.
- Empty states are warm, one-line, with a single action each.

## Test-id strategy and accessibility

`home-hero`, `home-intent`, `home-focus`, `home-focus-slot-${i}`, `home-due`, `home-learn`, `home-goals`, `home-capture`, `home-close-day`, `home-plan-day`. Cards are `section`s with headings.

## Test plan

[docs/test-plans/home.md](../../test-plans/home.md) §T05.

## Risks and open questions

- The marketing page is public and indexed; moving it changes its URL. **Ruling applied:** acceptable for a personal deployment; `/welcome` keeps the content.
- Evening threshold. **Ruling applied:** 18:00 local, with the close-day action always reachable from the hero.
