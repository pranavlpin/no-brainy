# nav — task ledger

Append-only ledger for the `nav` module (sidebar, breadcrumbs, top bar). See `CLAUDE.md` §2 and §2a.

| ID | Task | Date | Branch | Plan | Status |
|---|---|---|---|---|---|
| T09 | Grouped sidebar, badges, complete breadcrumbs | 2026-10-16 | feature/platform-daily-loop-overhaul | [plan](../plans/nav/sidebar-groups-and-breadcrumbs.md) | done — 32 files / 110 tests green; grouped collapsible sidebar with live badges, breadcrumbs show entity titles |
| T23 | Bug fix: top bar dropdowns hidden behind page content | 2026-10-17 | feature/product-adoption-wave-2 | [plan](../plans/nav/top-bar-dropdown-stacking.md) | fixed — root cause: the blurred top bar is its own stacking context with no z-index, so later page sections painted over its dropdowns; the bar now sits at `relative z-30` above page content and below overlays; 75 files / 231 tests green |
