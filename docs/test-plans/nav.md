# nav — test plan

## T09 — Grouped sidebar, badges, complete breadcrumbs

- Scope: unit + component.
- Unit: `navGroups` contains every route under `src/app/(dashboard)` that has a page (excluding detail and settings routes); `labelFor('/budgets')` is "Budgets".
- Component: `Sidebar` renders `nav-group-${key}` headers, toggles `aria-expanded` and hides items on collapse, hides items listed in `hiddenNavItems`, shows `nav-badge-/flashcards` when `cardsDue > 0`; `Breadcrumbs` renders "Budgets" for `/budgets`.

## T23 — Top bar dropdowns hidden behind page content (bug fix)

- Scope: component (regression test written first, failing).
- Component: `TopBar` renders `top-bar` with its own stacking layer above page content (`relative z-30`); clicking the bell opens `notification-panel` inside `top-bar`; clicking the avatar opens `user-menu-panel` inside `top-bar`.
- Browser: on the dev server, the open notification panel and user menu stay above the Today hero and cards; the mobile sidebar scrim, dialogs, command palette, and toasts still cover the bar.
