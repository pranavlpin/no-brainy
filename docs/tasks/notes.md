# notes — task ledger

Append-only ledger for the `notes` module (notes, editor, links, sharing). See `CLAUDE.md` §2 and §2a.

| ID | Task | Date | Branch | Plan | Status |
|---|---|---|---|---|---|
| T28 | Bug fix: note links to tasks, books, and decks fail at the database | 2026-10-17 | feature/product-adoption-wave-2 | [plan](../plans/notes/links-to-other-entities.md) | fixed — root cause: NoteLink.targetId carried a foreign key to notes, so only note-to-note links could be created. Migration drops the constraint, backlinks come from an explicit query, backup export filters by source note; 91 files / 254 tests green |
