# nav — test plan

## T09 — Grouped sidebar, badges, complete breadcrumbs

- Scope: unit + component.
- Unit: `navGroups` contains every route under `src/app/(dashboard)` that has a page (excluding detail and settings routes); `labelFor('/budgets')` is "Budgets".
- Component: `Sidebar` renders `nav-group-${key}` headers, toggles `aria-expanded` and hides items on collapse, hides items listed in `hiddenNavItems`, shows `nav-badge-/flashcards` when `cardsDue > 0`; `Breadcrumbs` renders "Budgets" for `/budgets`.
