# T28 — Note links to tasks, books, and decks fail at the database

**Module:** notes · **Date:** 2026-10-17 · **Branch:** `feature/product-adoption-wave-2` · **Ledger:** [docs/tasks/notes.md](../../tasks/notes.md) · **Type:** bug fix

## Reproduction and root cause

Note page, Add Link, Tasks tab, pick a task: `POST /api/notes/[id]/links` returns 500 and nothing is saved. `NoteLink.targetId` carries a foreign key to `notes.id` (`targetNote` relation, constraint `note_links_targetId_fkey`), so any target that is not a note violates the constraint. Only note-to-note links could ever be created; the picker offers tasks, books, and decks.

## Predecessors

- Linking predates the ledgers. Delta: the relation and its foreign key are removed; backlinks between notes are resolved by an explicit query.

## Scope and affected files

- `prisma/schema.prisma`: drop `targetNote` on `NoteLink` and `linkedFrom` on `Note`.
- `prisma/migrations/20261017100000_note_links_any_target/migration.sql`: drop constraint `note_links_targetId_fkey`.
- `src/app/api/notes/[id]/route.ts`: `linkedFrom` computed with `noteLink.findMany({ where: { targetType: 'note', targetId } })`.
- Tests: `tests/unit/notes/note-link-schema.test.ts` (schema has no target relation; a migration drops the constraint), `tests/integration/notes/note-detail-links.test.ts` (GET still returns `linkedFrom`).

## Fix approach

Minimal schema change. Notes are soft-deleted, so losing the cascade on the target side has no behavioural effect; the inbox undo path hard-deletes a note it created and no links can exist to it yet.

## Test-id strategy and accessibility

No UI change.

## Test plan

[docs/test-plans/notes.md](../../test-plans/notes.md) §T28.

## Owner ruling applied

The platform ledger's 2026-10-17 "End-to-end sweep defects" ruling (owner: "push the current changes and fix all in same branch.") pre-approves this plan on the integration branch. Found by the headless-Chrome sweep recorded in gitignored `evidences/e2e/full/REPORT.md`.
