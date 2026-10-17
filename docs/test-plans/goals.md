# goals — test plan

## T19 — Growth evidence

- Unit: `outcomePercent` is null without baseline, target, or measurement and clamps 0–100; weekly practice counts distinct days across practice evidence and completed sessions on goal tasks.
- Integration: evidence create is idempotent by `clientRequestId`; correction keeps the source; goal routes return measurement, practice, and evidence counts; financial goals keep amount progress.
- Component: `EvidenceForm` requires a summary and submits kind, date, and measurement; `BookExperiment` opens a composer with the book as source.
