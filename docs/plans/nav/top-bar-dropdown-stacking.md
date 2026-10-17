# T23 — Top bar dropdowns hidden behind page content

**Module:** nav · **Date:** 2026-10-17 · **Branch:** `feature/product-adoption-wave-2` · **Ledger:** [docs/tasks/nav.md](../../tasks/nav.md) · **Type:** bug fix

## Reproduction and root cause

Reported by the owner while testing the stacked branch: "When i click on notifications, the dropdown that opens, is hidden by page elements."

Steps: sign in, open Today, click the bell in the top bar. The panel appears below the bar but the hero card and the cards under it paint over it. The same happens with the avatar menu on the right of the bar.

Root cause: the top bar (`src/components/layout/top-bar.tsx`) carries `backdrop-blur-xl` since T02. `backdrop-filter` creates a CSS stacking context, so the panel's `z-50` only orders it against other children of the header. The header itself has `z-index: auto`, so it paints in tree order at the base layer of the content column. Every page section that comes later in the tree and forms its own stacking context (glass surfaces use `backdrop-filter`, motion blocks use `transform`, cards use `position: relative`) paints after the header and therefore over its dropdowns. Raising the panel's own z-index cannot fix this; the header needs a layer of its own above page content.

The header is a flex item, so a `z-index` on it takes effect; `relative` is added to make the positioning explicit.

## Predecessors

- [motion-and-design-system-v2.md](../platform/motion-and-design-system-v2.md) (T02) introduced the translucent, blurred top bar. Delta: the bar now declares an explicit stacking layer (`relative z-30`) between page content and overlays. The notification panel and user menu predate the ledgers and have no plan; their markup is unchanged apart from test ids.

## Stacking layers after the fix

| Layer | Elements |
|---|---|
| 0 | aurora background (fixed) |
| `z-10` | content column; inside pages: sticky table cells, note-card hover actions |
| `z-30` | top bar and its dropdowns (new) |
| `z-40` | mobile sidebar scrim, bottom nav, markdown cheatsheet toggle |
| `z-50` | sidebar, dialogs, inline modals, fullscreen editor, focus mode, flashcard review |
| `z-[60]` | editor confirm dialog |
| `z-[70]` | command palette |
| `z-[100]` | toasts |

The mobile sidebar scrim and the bottom nav are siblings of the content column at the shell root, where the column sits at `z-10`, so they keep covering the bar as before. Dialogs render through a Radix portal at `document.body` and stay above the bar.

## Scope and affected files

- `src/components/layout/top-bar.tsx`: header gains `relative z-30` and `data-testid="top-bar"`.
- `src/components/notifications/notification-panel.tsx`: panel root gains `data-testid="notification-panel"`.
- `src/components/layout/user-menu.tsx`: menu root gains `data-testid="user-menu-panel"`.
- `tests/component/nav/top-bar.test.tsx` (new).

## Related bugs

- The user menu dropdown shares the root cause and is fixed by the same change.
- At widths under about 340 px the notification panel's left edge is clipped by the content column's `overflow-hidden`, because the panel is right-aligned to the bell and wider than the space to its left. Pre-existing, not a z-order problem, out of scope here.

## Fix approach

Minimal: give the top bar its own stacking layer above page content. No portal, no change to the dropdowns' positioning or click-outside handling.

## Test-id strategy and accessibility

New ids: `top-bar`, `notification-panel`, `user-menu-panel`. No change to roles, labels, or keyboard behavior. jsdom does not lay out or paint, so the regression test pins the stacking contract (the bar's layer class and that both dropdowns open inside the bar); the paint order is confirmed in the browser on the dev server.

## Test plan

[docs/test-plans/nav.md](../../test-plans/nav.md) §T23.

## Owner ruling applied

The platform ledger's 2026-10-16 "Acceptance-testing defects" ruling treats defects the owner reports in the batch's unlanded work as pre-approved bug-fix tasks, registered and planned like any other task. The defect comes from T02 on `feature/platform-daily-loop-overhaul`, which has not landed. The fix is committed on the tip of the stack, `feature/product-adoption-wave-2`, because that is the build the owner is testing and both PRs land in sequence; PR #6 on its own remains affected until PR #7 lands.
