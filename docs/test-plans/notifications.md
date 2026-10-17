# notifications — test plan

## T12 — Scheduled nudges endpoint and habit cleanup

- Scope: unit + integration.
- Unit: `generateForUser` creates `review_reminder` only after 20:00 local with no review, `morning_brief` only before 10:00 local with an empty plan, and never duplicates within a day (mocked Prisma).
- Integration: `POST /api/cron/daily` returns 401 without the bearer secret, 503 when `CRON_SECRET` is unset, and per-user counts when authorized; notification preferences schema rejects `habitReminders`.
