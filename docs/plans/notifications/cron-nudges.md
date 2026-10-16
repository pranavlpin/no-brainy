# T12 — Scheduled nudges endpoint and habit cleanup

**Module:** notifications · **Date:** 2026-10-16 · **Branch:** `feature/platform-daily-loop-overhaul` · **Ledger:** [docs/tasks/notifications.md](../../tasks/notifications.md)

## Summary

Notifications and insights only exist when the client asks. This task adds a protected cron endpoint that a scheduler can hit to generate the day's nudges for every user, including a review reminder and a due-cards digest, and removes the leftover habit notification preference from the module removed in commit `a90ad39`.

## Predecessors

No plan exists for `src/app/api/notifications/generate/route.ts`. Delta: generation logic moves into `src/lib/notifications/generate.ts` so both the client route and the cron endpoint share it; habit preference removed.

## Scope and affected files

- `src/lib/notifications/generate.ts` (new): `generateForUser(userId, nowKey)` returning created counts; adds `review_reminder` (after 20:00 local, no review today) and `morning_brief` (before 10:00 local, plan has no focus) types
- `src/app/api/notifications/generate/route.ts`: delegates to the library
- `src/app/api/cron/daily/route.ts` (new): `POST` with `Authorization: Bearer ${CRON_SECRET}`; iterates users; returns per-user counts; 401 without the secret; 503 when `CRON_SECRET` is unset
- `.env.example`: `CRON_SECRET`
- `docs/DEPLOYMENT.md`: a short section on scheduling with Cloud Scheduler (current code-facing docs, allowed)
- Habit cleanup: `src/app/(dashboard)/settings/page.tsx` toggle list, `src/hooks/use-settings.ts` type, `src/app/api/settings/notification-preferences/route.ts` schema, any remaining `habit` strings in `src/`

## Dependencies

T03 for local-time thresholds.

## Data model / state changes

None. Notification `type` gains two string values.

## UI/UX

Notification panel renders the two new types with distinct icons.

## Test-id strategy and accessibility

`notification-${id}` rows already exist or are added where missing.

## Test plan

[docs/test-plans/notifications.md](../../test-plans/notifications.md) §T12.

## Risks and open questions

- Iterating all users is fine for one user; the endpoint batches 50 at a time anyway. **Ruling applied.**

## Refinements while on the task branch (2026-10-16)

- Notification preference keys and defaults now live in `src/lib/notifications/preferences.ts`; the retired `habitReminders` key is dropped on read, and a `morningBrief` preference is added alongside the existing review reminder.
- New notification types `morning_brief` (before 10:00 local while the plan has no focus) and `review_reminder` (after 20:00 local without a review) render with their own icons and deep-link to the planner and the close-the-day flow.
- Habit strings that remain in AI prompt variable types (`coach.ts`, `insights.ts`) and the search entity union are inert type members with no UI; they are left for a later cleanup rather than widened into this task.
- Verified on the dev server: unauthenticated and wrong-token calls return 401, an authorized run created 4 nudges for the owner, and an immediate second run created 0.
