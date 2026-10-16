# T22 — Workspace states, typography pass, Work / Personal context filter

**Module:** platform · **Date:** 2026-10-16 · **Branch:** `feature/product-adoption-wave-2` · **Ledger:** [docs/tasks/platform.md](../../tasks/platform.md) · **Package:** [acceptance-branch-adoption.md](../product/acceptance-branch-adoption.md)

## Summary

Shared page primitives (header with eyebrow and display title, loading, error with retry, empty) applied across the main pages in this branch's visual language, and a Work / Personal / All context filter in the top bar that narrows tasks, projects, and Today.

## Predecessors

- [motion-and-design-system-v2.md](./motion-and-design-system-v2.md) (T02). Delta: adds typography utilities and page-state primitives.
- Ported, credited: `workspace-states.tsx` and the context filter from `test/product-final-acceptance` (NB-04), restyled.

## Scope and affected files

- `src/components/ui/workspace-states.tsx`, `src/app/globals.css` (`.eyebrow`, `.display-title`)
- `src/stores/ui-store.ts` (`context`, hydrated), `src/components/layout/top-bar.tsx`
- `src/lib/tasks/context.ts` (filter helper), `src/app/(dashboard)/tasks/page.tsx`, `projects/page.tsx`, `src/app/(dashboard)/page.tsx`
- Headers on tasks, planner, reviews, goals, projects, inbox, notes, books, flashcards, settings pages

## Data model / state changes

UI store adds `context`. Unclassified tasks show in every context.

## Test plan

[docs/test-plans/platform.md](../../test-plans/platform.md) §T22.

## Risks and open questions

- Context is a filter, never a separate dataset. **Ruling applied.**

## Refinements (while the branch was open)

- `PageHeader` takes an optional icon beside the title; the eyebrow names the sidebar group (Today, Capture, Do, Grow, Reflect, You) so the page and the navigation speak the same language.
- The context is a client-side filter: tasks and Today lists pass through `filterByContext`, which keeps unclassified tasks; projects always carry a context, so the projects page asks the server for the chosen one and the new-project form pre-selects it.
- The switch lives in the top bar from the medium breakpoint; on phones the pages still honour the stored choice.
- The choice persists under `nobrainy-context` and is restored by the same post-mount hydration the other UI preferences use, so the first client render matches the server.
- Headers applied on Tasks, Projects, Inbox, Goals, Reviews, Planner, and Settings; Notes, Books, Flashcards keep their current headers until those modules are next touched.
