# reviews — test plan

## T07 — Evening close-the-day with tomorrow handoff

- Scope: unit + component + integration.
- Unit: review update schema accepts `tomorrowIntent` up to 280 chars; reflection template builder produces the three headings.
- Integration: `PUT /api/reviews/daily/[date]` with `tomorrowIntent` upserts the next day's plan `intentMd` when empty and leaves a differing existing intent alone.
- Component: `CloseDayFlow` advances through steps with `close-day-next`, disables finish until mood and `tomorrow-intent-input` are set, and calls `onFinish` with the assembled payload.

## T20 — Weekly adjustment

- Unit: `weekStartFor` returns the Monday for any day; non-Mondays are rejected as week keys.
- Integration: `GET /api/reviews/weekly/[weekStart]` creates on first read; `PUT` with `nextTaskId` sets that task's `plannedDate` to the following Monday without touching its deadline.
- Component: `WeeklyEditor` keeps three outcome lines, shows save state, and calls save with the assembled payload.
