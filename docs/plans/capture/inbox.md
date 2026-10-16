# T16 — Inbox: captures, processing, undo, capture-modal integration

**Module:** capture · **Date:** 2026-10-16 · **Branch:** `feature/product-adoption-wave-2` · **Ledger:** [docs/tasks/capture.md](../../tasks/capture.md) · **Package:** [acceptance-branch-adoption.md](../product/acceptance-branch-adoption.md)

## Summary

One Inbox for raw thoughts and links, processed later into a task, note, bookmark, or someday item, with undo. The natural-language capture stays the fast path; Shift+Enter or the Inbox chip saves raw text to the Inbox.

## Predecessors

- [command-palette-and-parser.md](./command-palette-and-parser.md) (T08). Delta: the modal gains an Inbox destination and Shift+Enter; `inbox:` prefix parses to kind `inbox`.
- [bottom-nav-and-pwa.md](../mobile/bottom-nav-and-pwa.md) (T11). Delta: the Stash slot becomes Inbox.
- Ported, credited: the `Capture` model, states, transactional processing, and undo from `test/product-final-acceptance` (NB-06).

## Scope and affected files

- `prisma/schema.prisma`: `Capture` model (`clientRequestId` unique per user, `state`, `destinationType/Id`, `sourceUrl`); migration `add_captures`
- `src/lib/validations/inbox.ts`, `src/lib/types/inbox.ts`, `src/lib/inbox/process.ts` (transactional conversion)
- `src/app/api/inbox/route.ts` (list, create), `[id]/route.ts` (state), `[id]/process/route.ts`
- `src/hooks/use-inbox.ts`
- `src/components/inbox/capture-processor.tsx`, `src/app/(dashboard)/inbox/page.tsx`
- `src/components/quick-capture/quick-capture-modal.tsx`, `src/lib/capture/parse.ts`
- `src/lib/nav/items.ts` (Inbox in Capture group), `src/app/api/nav/badges/route.ts` (inbox count), `src/components/layout/bottom-nav.tsx`

## Data model / state changes

New table `captures`. Processing writes the destination and marks the capture processed in one transaction; repeating the same request returns the existing result.

## UI/UX

Inbox list with To process / Someday / Processed / Archived views, search, pagination, a Process dialog that pre-fills the title, Save & next, and an undo banner. Empty state celebrates a clear inbox.

## Test-id strategy and accessibility

`capture-${id}`, `process-${id}`, `inbox-undo`, `capture-chip-kind`. Dialog uses the shared Radix dialog.

## Test plan

[docs/test-plans/capture.md](../../test-plans/capture.md) §T16.

## Risks and open questions

- Stash remains for files and sensitive channels; no automatic import into Inbox. **Ruling applied.**
