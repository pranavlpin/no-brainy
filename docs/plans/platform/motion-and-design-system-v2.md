# T02 — Motion system and design system v2

**Module:** platform · **Date:** 2026-10-16 · **Branch:** `feature/platform-daily-loop-overhaul` · **Ledger:** [docs/tasks/platform.md](../../tasks/platform.md)

## Summary

Give the app the smooth, animated, visually distinct feel the owner asked for: a layered animated background, glass card surfaces, a single motion vocabulary with reduced-motion support, animated dialogs and stacked toasts, page transitions, and route-level loading and error states. Everything later tasks build on.

## Predecessors

No plan file exists for the current theme system (commits `a0299ab`, `9535d42`, `b704673`). This plan supersedes the visual layer of that work: the four preset palettes and the custom theme builder stay functional, and the new surface and background tokens derive from the same CSS variables so presets still recolor the app.

## Scope and affected files

- `package.json`: add `framer-motion`, `tailwindcss-animate`, `@radix-ui/react-dialog`, `@radix-ui/react-tooltip` (own commit)
- `tailwind.config.ts`: register `tailwindcss-animate`; add `surface`, `glass`, `glow` tokens, `backdrop-blur` defaults, keyframes for `aurora`, `shimmer`, `pop`
- `src/app/globals.css`: new tokens `--surface`, `--surface-strong`, `--surface-border`, `--glow-a/b/c`; aurora background layers; glass utility classes; `prefers-reduced-motion` global guard
- `src/components/motion/` (new): `motion-provider.tsx` (wraps `MotionConfig reducedMotion="user"` and `LazyMotion`), `fade-in.tsx`, `stagger-list.tsx`, `animated-number.tsx`, `presence.tsx`, `page-transition.tsx`, `index.ts`
- `src/components/ui/dialog.tsx`: rebuilt on Radix (portal, focus trap, escape, scroll lock) with framer-motion enter and exit; same props API so existing callers keep working, plus `size`
- `src/components/ui/toast.tsx` + `src/hooks/use-toast.ts`: stacked toasts (max 3), ids, `show(message, type, { action })`, animated enter and exit, pause on hover; `show()` keeps its two-argument signature
- `src/components/ui/card.tsx` (new): `Card` surface with `variant: 'glass' | 'solid' | 'outline'` and optional `hoverLift`
- `src/components/layout/app-background.tsx` (new): fixed aurora gradient blobs plus dot grid, reduced-motion still
- `src/components/layout/app-shell.tsx`: mounts `AppBackground`, wraps `main` content in `PageTransition`
- `src/app/(dashboard)/template.tsx` (new): per-navigation fade and 8 px rise
- `src/app/(dashboard)/loading.tsx`, `src/app/(dashboard)/error.tsx` (new)
- `src/components/layout/sidebar-nav.tsx`: active indicator becomes a `layoutId` pill that slides between items
- `src/components/providers.tsx`: mounts `MotionProvider`

## Dependencies

`framer-motion`, `tailwindcss-animate`, `@radix-ui/react-dialog`, `@radix-ui/react-tooltip`. Pre-approved by the 2026-10-16 ruling.

## Data model / state changes

`use-toast` store shape changes from a single message to a list of toasts. No server changes.

## UI/UX

- Background: three slow-drifting radial gradient blobs tinted from `--retro-blue`, `--retro-pink`, `--retro-mint` at low alpha over the page background, dot grid on top. Drift period 18 to 26 s. Static under reduced motion.
- Surfaces: cards become translucent with blur and a 1 px border from `--surface-border`; the retro hard-shadow buttons stay as the accent language for primary actions.
- Motion vocabulary: durations 150 ms (micro), 220 ms (component), 320 ms (page); easing `[0.2, 0.8, 0.2, 1]`; springs for layout moves (`stiffness 420, damping 34`).
- Dialog: backdrop fade, panel scale from 0.96 and 8 px rise; exit reverses.
- Toast: slide in from bottom right, stack with 8 px gap, auto-dismiss 3.5 s, error 6 s.
- Reduced motion: `MotionConfig reducedMotion="user"` disables transforms; CSS keyframes guarded by media query.

## Test-id strategy and accessibility

- Dialog gets `data-testid="dialog-panel"`, toast items `toast-${id}`, nav pill `nav-active-pill`.
- Radix supplies `role="dialog"`, `aria-modal`, labelled by the title; toasts render inside `role="status"` region.
- All color tokens keep the existing contrast; glass surfaces fall back to solid when `backdrop-filter` is unsupported.

## Test plan

[docs/test-plans/platform.md](../../test-plans/platform.md) §T02.

## Risks and open questions

- Framer Motion increases bundle size (~30 kB gz with `LazyMotion`). **Ruling applied:** accepted; single-user app, smoothness is the stated priority.
- `backdrop-filter` cost on low-end devices. **Ruling applied:** blur limited to 12 px, and only on cards and overlays, not the background.
- Radix Dialog changes DOM placement (portal). Existing callers that rely on inline placement: none found. Verified by test that `Dialog` still accepts `open`, `onClose`, `title`, `description`, `onConfirm`, `variant`.
