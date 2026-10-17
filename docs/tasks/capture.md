# capture — task ledger

Append-only ledger for the `capture` module (quick capture, command palette). See `CLAUDE.md` §2 and §2a.

| ID | Task | Date | Branch | Plan | Status |
|---|---|---|---|---|---|
| T08 | Command palette and natural-language capture | 2026-10-16 | feature/platform-daily-loop-overhaul | [plan](../plans/capture/command-palette-and-parser.md) | done — 29 files / 102 tests green; ⌘K palette, c capture, g-chords, ? sheet; search page Cmd+K conflict removed |
| T16 | Inbox: captures, processing, undo, capture-modal integration | 2026-10-16 | feature/product-adoption-wave-2 | [plan](../plans/capture/inbox.md) | done — 55 files / 183 tests green; migration add_captures; idempotent create and process, undo removes the destination; Inbox page, modal Shift+Enter, nav badge |
