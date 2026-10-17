# T08 — Command palette and natural-language capture

**Module:** capture · **Date:** 2026-10-16 · **Branch:** `feature/platform-daily-loop-overhaul` · **Ledger:** [docs/tasks/capture.md](../../tasks/capture.md)

## Summary

Cmd+K opens a title-only capture box, and the search page binds the same chord, so both fire there. This task introduces a command palette for navigation, actions, and search, and makes capture understand dates, tags, goals, and priority inline.

## Predecessors

No plan exists for `src/components/quick-capture/**` or the search page shortcut. Delta: Cmd+K becomes the palette; capture moves to `c` and to the palette; the search page drops its own Cmd+K binding.

## Scope and affected files

- `package.json`: add `cmdk` (own commit)
- `src/lib/capture/parse.ts` (new): pure parser → `{ title, dueDate?, tags[], goalQuery?, priority?, kind: 'task' | 'note' }`. Dates: today, tomorrow, tonight, weekday names (next occurrence), "next week" (next Monday), "in N days", `YYYY-MM-DD`, `DD/MM`. Tokens: `#tag`, `@goal words` (until next token), `!urgent|!high|!medium|!low|!1..!4`, leading `note:` or `task:`; default kind task
- `src/components/command-palette/command-palette.tsx` (new): groups Navigate (all nav items), Actions (New task, New note, Capture, Start review, Plan the day, Toggle dark mode), Search (debounced `/api/search` results for notes and tasks)
- `src/components/command-palette/shortcuts-provider.tsx` (new): global key handling with input-focus guards; `mod+k` palette, `c` capture, `?` shortcut sheet, `g` then `t|p|n|r|g|h` go-to
- `src/components/quick-capture/quick-capture-modal.tsx`: rebuilt on the T02 dialog; live chips show parsed date, tags, goal, priority; Enter submits; Tab cycles kind
- `src/components/quick-capture/quick-capture-provider.tsx`: opens on `c` and from the palette; no longer owns Cmd+K
- `src/app/(dashboard)/search/page.tsx`: remove Cmd+K handler; `/` focuses the input
- `src/components/layout/top-bar.tsx`: search pill that opens the palette, shows the chord

## Dependencies

`cmdk`; T02 dialog and motion; goals list for `@goal` matching.

## Data model / state changes

None server-side. Capture creates tasks with `dueDate`, `tags`, `priority`, `goalId` resolved client-side from the goals cache.

## UI/UX

- Palette animates like the dialog; results use arrow keys; Enter runs.
- Chips appear as you type with a 120 ms pop.
- Shortcut sheet lists all bindings.

## Test-id strategy and accessibility

`command-palette`, `palette-item-${id}`, `capture-input`, `capture-chip-${kind}`. The palette is a Radix dialog with `aria-label="Command palette"`.

## Test plan

[docs/test-plans/capture.md](../../test-plans/capture.md) §T08.

## Risks and open questions

- Single-key shortcuts must never fire while typing. **Ruling applied:** guard on input, textarea, contenteditable, and CodeMirror focus.
