# T21 — Core backup export / import, personal setup defaults, reminder quiet hours

**Module:** platform · **Date:** 2026-10-16 · **Branch:** `feature/product-adoption-wave-2` · **Ledger:** [docs/tasks/platform.md](../../tasks/platform.md) · **Package:** [acceptance-branch-adoption.md](../product/acceptance-branch-adoption.md)

## Summary

A versioned JSON export of the core workspace (captures, projects, tasks, plans, reviews, focus sessions, goals, evidence, notes and their links), a preview-then-confirm additive import with id remapping and receipts, personal defaults (capacity, working window, context, sound), and reminder quiet hours.

## Predecessors

- [cron-nudges.md](../notifications/cron-nudges.md) (T12). Delta: generation honors quiet hours and a review-reminder time.
- [user-timezone-dates.md](./user-timezone-dates.md) (T03). Delta: the Time settings section grows into personal setup.
- Ported, credited: backup format, preview/import flow, and setup form from `test/product-final-acceptance` (NB-13).

## Scope and affected files

- `prisma/schema.prisma`: `CoreImportReceipt`; migration `add_core_import_receipts`
- `src/lib/data/backup.ts` (export, validate, plan import, apply import), `src/lib/validations/backup.ts`
- `src/app/api/data/export/route.ts`, `preview/route.ts`, `import/route.ts`
- `src/lib/settings/personal.ts`, `src/app/api/settings/personal/route.ts`, `src/lib/notifications/preferences.ts` (quiet hours), `src/lib/notifications/generate.ts`
- `src/components/settings/core-backup.tsx`, `personal-setup.tsx`, `src/app/(dashboard)/settings/page.tsx`
- `src/lib/planner/today.ts` (new plans take defaults)

## Data model / state changes

New table `core_import_receipts`; personal settings live in `users.preferences`.

## UI/UX

Export button, file picker, preview counts, confirm; setup form with plain explanations; quiet hours inputs.

## Test-id strategy and accessibility

`core-backup`, `backup-preview`, `personal-setup`, `settings-quiet-hours`.

## Test plan

[docs/test-plans/platform.md](../../test-plans/platform.md) §T21.

## Risks and open questions

- Import is additive only; nothing is replaced or deleted. **Ruling applied.**
