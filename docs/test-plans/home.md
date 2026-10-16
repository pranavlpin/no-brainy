# home — test plan

## T05 — Today cockpit as the app home

- Scope: unit + component + integration.
- Unit: `greetingFor(hour)` returns morning/afternoon/evening; `dayPhase(hour, focusDone)` returns `morning | day | evening | closed`.
- Integration: `GET /api/home` with mocked Prisma assembles plan, review, learn, goals, and streak sections for a user in `Asia/Kolkata`; stale goals are those without task activity in 7 days.
- Component: `HomePage` renders `home-hero`, `home-focus`, `home-learn`, `home-goals`; shows `home-plan-day` when no focus tasks and `home-close-day` after 18:00 local; the marketing page is reachable at `/welcome` (route file exists test).
