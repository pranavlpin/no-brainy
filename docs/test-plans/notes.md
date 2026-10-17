# notes — test plan

## T28 — Links to other entities (bug fix)

- Scope: unit + integration (regression tests written first, failing).
- Unit: `prisma/schema.prisma` declares no relation on `NoteLink.targetId`, and a migration drops `note_links_targetId_fkey`.
- Integration: `GET /api/notes/<id>` returns `linkedFrom` from an explicit note-link query.
