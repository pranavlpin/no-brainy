# T09 — Grouped sidebar, badges, complete breadcrumbs

**Module:** nav · **Date:** 2026-10-16 · **Branch:** `feature/platform-daily-loop-overhaul` · **Ledger:** [docs/tasks/nav.md](../../tasks/nav.md)

## Summary

Sixteen flat sidebar items with thin dividers are a tax on every visit, and the breadcrumb label map covers only half the modules. This task groups navigation, adds live badges, and completes labels.

## Predecessors

No plan exists for `src/components/layout/sidebar*.tsx`, `breadcrumbs.tsx`, or the sidebar order settings (commit `cf860f2`). Delta: fixed groups replace free drag ordering; hidden toggles stay; groups collapse.

## Scope and affected files

- `src/lib/nav/items.ts` (new): single source of nav items, labels, icons, groups: Today (`/`), Capture (`/stash`, `/notes`, `/bookmarks`), Do (`/tasks`, `/planner`, `/goals`), Learn (`/flashcards`, `/books`), Money (`/expenses`, `/budgets`), Reflect (`/reviews`, `/analytics`, `/insights`, `/ai`), More (`/watchlist`, `/search`)
- `src/components/layout/sidebar.tsx`: renders groups with collapsible headers (persisted in the UI store), badges, active pill
- `src/stores/ui-store.ts`: `collapsedGroups`, keeps `hiddenNavItems`; `navOrder` retired (migration reads old key and ignores it)
- `src/components/settings/sidebar-order.tsx`: becomes visibility toggles grouped the same way
- `src/app/api/nav/badges/route.ts` (new): `{ cardsDue, overdueTasks, unreadNotifications }`; polled every 60 s
- `src/components/layout/breadcrumbs.tsx`: labels sourced from `items.ts`; detail pages show the entity title when the page provides it via a small `useBreadcrumbTitle` store

## Dependencies

T02 motion; T05 for the Today route.

## Data model / state changes

UI store adds `collapsedGroups: string[]`.

## UI/UX

- Group headers are small caps; collapsing animates height.
- Badges are 16 px pills; zero hides them.
- Collapsed sidebar shows icons only with tooltips.

## Test-id strategy and accessibility

`nav-group-${key}`, `nav-item-${href}`, `nav-badge-${href}`. Group headers are buttons with `aria-expanded`.

## Test plan

[docs/test-plans/nav.md](../../test-plans/nav.md) §T09.

## Risks and open questions

- Users who customized order lose it. **Ruling applied:** single owner; grouping is the better default.
