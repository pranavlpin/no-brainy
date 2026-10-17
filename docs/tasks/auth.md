# auth — task ledger

Append-only ledger for the `auth` module (login, register, session middleware). See `CLAUDE.md` §2 and §2a.

| ID | Task | Date | Branch | Plan | Status |
|---|---|---|---|---|---|
| T24 | Bug fix: protect Inbox and Projects, hydration-safe auth forms, honour callbackUrl | 2026-10-17 | feature/product-adoption-wave-2 | [plan](../plans/auth/protected-routes-and-form-posting.md) | fixed — root cause: the matcher listed sections by hand and missed /inbox and /projects; the forms had no method so a pre-hydration submit was a native GET; login pushed / unconditionally. Matcher now covers every dashboard folder (test enforced), forms post, login honours a same-origin callbackUrl; 91 files / 254 tests green |
