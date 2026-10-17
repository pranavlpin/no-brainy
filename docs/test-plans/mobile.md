# mobile — test plan

## T11 — Bottom navigation, capture FAB, PWA manifest

- Scope: unit + component.
- Unit: `manifest()` returns `display: 'standalone'`, two PNG icons, and theme colors; icon files exist at the referenced paths.
- Component: `BottomNav` renders `bottom-nav-/`, `bottom-nav-/tasks`, `capture-fab`, `bottom-nav-/stash`; the active item has `aria-current="page"`; `capture-fab` opens the capture modal.
