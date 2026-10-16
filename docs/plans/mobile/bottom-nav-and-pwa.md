# T11 — Bottom navigation, capture FAB, PWA manifest

**Module:** mobile · **Date:** 2026-10-16 · **Branch:** `feature/platform-daily-loop-overhaul` · **Ledger:** [docs/tasks/mobile.md](../../tasks/mobile.md)

## Summary

On a phone the app is a shrunken desktop with no way to capture, since the only trigger is a keyboard chord. This task adds a bottom tab bar, a floating capture button, installability, and swipe-to-complete on task rows.

## Predecessors

No plan exists for the responsive shell. Delta: below `lg` the sidebar is replaced by a bottom bar and the capture FAB.

## Scope and affected files

- `src/app/manifest.ts` (new): name, short name, `display: standalone`, theme and background colors from the retro palette, icons
- `public/icons/` (new): 192 and 512 px PNG icons and an Apple touch icon generated from `public/icon.svg` with `sharp` via `scripts/generate-icons.mjs`
- `src/app/layout.tsx`: `viewport` export with `themeColor` and `viewportFit: 'cover'`; Apple meta tags
- `src/components/layout/bottom-nav.tsx` (new): Today, Tasks, Capture (raised FAB), Stash, Menu (opens the drawer sidebar); safe-area padding
- `src/components/layout/app-shell.tsx`: mounts `BottomNav` below `lg`; main gets bottom padding
- `src/components/tasks/task-list.tsx`: rows support drag-right to complete (threshold 96 px) using framer-motion `drag="x"`, desktop unaffected
- `src/app/globals.css`: `100dvh` usage, `env(safe-area-inset-bottom)`

## Dependencies

T02, T08 (capture modal), T04 (optimistic toggle). `sharp` is already present as a Next dependency; the script runs once and commits the PNGs.

## Data model / state changes

None.

## UI/UX

- The FAB is a 56 px circle with the retro hard shadow; tapping opens capture.
- Swipe reveals a green check behind the row; release past the threshold completes.
- Bottom bar hides when a dialog is open and when the on-screen keyboard is likely (focused input).

## Test-id strategy and accessibility

`bottom-nav`, `bottom-nav-${href}`, `capture-fab`. Items are links with `aria-current`.

## Test plan

[docs/test-plans/mobile.md](../../test-plans/mobile.md) §T11.

## Risks and open questions

- Service worker for offline is out of scope; the manifest alone makes the app installable. **Ruling applied.**
