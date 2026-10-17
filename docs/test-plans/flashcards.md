# flashcards — test plan

## T26 — Card creation and due count (bug fix)

- Scope: unit + integration (regression tests written first, failing).
- Unit: `useCreateCard` calls `POST /api/decks/<deckId>/cards` with a body that omits `deckId`.
- Integration: `GET /api/decks/<id>` counts a card scheduled for the start of the user's current day as due even when the server's UTC date differs.
