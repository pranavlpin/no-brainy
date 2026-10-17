# capture — test plan

## T08 — Command palette and natural-language capture

- Scope: unit + component.
- Unit: `parseCapture` handles "Call bank tomorrow #finance !high", "note: idea about onboarding", "Gym on friday @Fitness goal", "Pay rent 2026-11-01", "Draft spec in 3 days", weekday rollover across week boundaries, and leaves plain titles untouched; priorities `!1..!4` map urgent→low.
- Component: `CommandPalette` opens with `mod+k`, filters nav items, runs an action on Enter; `QuickCaptureModal` shows `capture-chip-date` when a date is parsed and submits a task with `dueDate`; typing `c` inside an input does not open capture.
