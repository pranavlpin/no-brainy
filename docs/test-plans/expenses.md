# expenses — test plan

## T31 — Bulk entry row ids (bug fix)

- Scope: component (regression test written first, failing).
- Component: two independent renders of `ExpenseBulkEntry` produce the same `data-row` ids, and the ids follow `row-<n>`.
