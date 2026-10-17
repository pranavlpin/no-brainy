# expenses — task ledger

Append-only ledger for the `expenses` module (expenses, categories, bulk entry, import). See `CLAUDE.md` §2 and §2a.

| ID | Task | Date | Branch | Plan | Status |
|---|---|---|---|---|---|
| T31 | Bug fix: bulk entry rows get deterministic ids | 2026-10-17 | feature/product-adoption-wave-2 | [plan](../plans/expenses/bulk-entry-row-ids.md) | fixed — root cause: Math.random() row ids were rendered into attributes. Ids come from a per-instance counter; 91 files / 254 tests green |
