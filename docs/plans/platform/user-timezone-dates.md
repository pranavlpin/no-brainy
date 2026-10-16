# T03 — User-timezone day boundaries

**Module:** platform · **Date:** 2026-10-16 · **Branch:** `feature/platform-daily-loop-overhaul` · **Ledger:** [docs/tasks/platform.md](../../tasks/platform.md)

## Summary

"Today" is computed in UTC in the planner, carry-forward, daily and weekly reviews, notification generation, and several client pages, while the user's `timezone` field is stored but unused. For a user in India, early mornings land on yesterday's plan. This task introduces one date helper module that every "today" computation uses, honors `user.timezone`, and auto-detects the browser timezone on first load.

## Predecessors

No plan exists for the original planner or review routes. This plan changes their day-boundary behavior; the delta is "calendar day is the user's local day instead of UTC".

## Scope and affected files

- `src/lib/dates/index.ts` (new): `todayKey(tz)`, `dateKeyFromDate(date, tz)`, `addDays(key, n)`, `dayBoundsUtc(key)` (DB `@db.Date` columns store UTC midnight, so the bounds for a key are `[key T00:00Z, key+1 T00:00Z)`), `isValidDateKey`, `weekBounds(key)`, `formatDateKey(key, options)`, `userTimezone(user)` (falls back to `Asia/Kolkata` when stored tz is empty or `UTC`, because the owner is the only user and the seed already uses that zone)
- `src/hooks/use-user-today.ts` (new): client hook returning today's key from the browser zone, re-evaluated at midnight
- `src/app/api/settings/timezone/route.ts` (new): `PATCH { timezone }` validated against `Intl.supportedValuesOf('timeZone')`
- `src/components/timezone-sync.tsx` (new): on mount, if the session user's stored timezone differs from the browser's, PATCH once
- Replace UTC-day computations in: `src/app/api/planner/today/route.ts`, `src/app/api/planner/[date]/route.ts`, `src/app/api/planner/carry-forward/route.ts`, `src/app/api/reviews/daily/route.ts`, `src/app/api/reviews/daily/[date]/route.ts`, `src/app/api/reviews/weekly/route.ts`, `src/app/api/notifications/generate/route.ts`, `src/app/(dashboard)/reviews/page.tsx`, `src/app/(dashboard)/reviews/daily/page.tsx`, `src/app/(dashboard)/insights/page.tsx`
- `src/lib/types/auth.ts`: no change; `AuthUser.timezone` already exists

## Dependencies

None new. Uses `Intl.DateTimeFormat` with `timeZone`.

## Data model / state changes

None. The `users.timezone` column already exists.

## UI/UX

Invisible except that planner, reviews, and reminders now agree with the wall clock. Settings page shows the detected timezone read-only under Preferences (small, informational).

## Test-id strategy and accessibility

`data-testid="settings-timezone"` for the informational row.

## Test plan

[docs/test-plans/platform.md](../../test-plans/platform.md) §T03.

## Risks and open questions

- Display formatting sites that call `toISOString().split('T')[0]` on `@db.Date` values are correct as-is (those values are UTC midnight) and are left alone; only "now → today" computations change. **Ruling applied.**
- Historical day plans and reviews keyed by UTC date stay where they are; no backfill. **Ruling applied:** acceptable for a single user; a note in the settings row explains it.
