# books — test plan

## T27 — Book notes drafts (bug fix)

- Scope: unit (regression tests written first, failing).
- Unit: `useDebouncedDrafts` saves once with the latest value after the debounce, keeps the draft when the server value changes underneath, and flushes a pending draft on unmount.
