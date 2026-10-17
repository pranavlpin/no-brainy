# books — task ledger

Append-only ledger for the `books` module (library, reading progress, book notes). See `CLAUDE.md` §2 and §2a.

| ID | Task | Date | Branch | Plan | Status |
|---|---|---|---|---|---|
| T27 | Bug fix: book notes save as drafts without losing keystrokes | 2026-10-17 | feature/product-adoption-wave-2 | [plan](../plans/books/book-notes-drafts.md) | fixed — root cause: one PATCH per keystroke and the editor reset to the stale server echo. Summary, learnings, and application keep a local draft and save 600 ms after the last change through useDebouncedDrafts; 91 files / 254 tests green |
