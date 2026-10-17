# stash — task ledger

Append-only ledger for the `stash` module (channels, messages, files, search). See `CLAUDE.md` §2 and §2a.

| ID | Task | Date | Branch | Plan | Status |
|---|---|---|---|---|---|
| T32 | Bug fix: message search available on every channel | 2026-10-17 | feature/product-adoption-wave-2 | [plan](../plans/stash/message-search-for-every-channel.md) | fixed — root cause: the search toggle shared the sensitive-only guard. Toggle renders for every channel; 91 files / 254 tests green |
