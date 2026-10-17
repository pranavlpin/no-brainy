# flashcards — task ledger

Append-only ledger for the `flashcards` module (decks, cards, review, quiz). See `CLAUDE.md` §2 and §2a.

| ID | Task | Date | Branch | Plan | Status |
|---|---|---|---|---|---|
| T26 | Bug fix: card creation endpoint and due-count consistency | 2026-10-17 | feature/product-adoption-wave-2 | [plan](../plans/flashcards/card-creation-and-due-count.md) | fixed — root cause: the hook posted to a non-existent /api/flashcards and the deck route measured due cards from server-local midnight. Cards post under their deck; due uses the user's day boundary like the badges; 91 files / 254 tests green |
