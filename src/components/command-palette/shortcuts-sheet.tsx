'use client'

import { Dialog } from '@/components/ui/dialog'
import { GOTO_CHORDS, NAV_ITEMS_BY_HREF } from '@/lib/nav/items'

interface ShortcutsSheetProps {
  open: boolean
  onClose: () => void
}

const GLOBAL: { keys: string[]; label: string }[] = [
  { keys: ['⌘', 'K'], label: 'Command palette' },
  { keys: ['C'], label: 'Quick capture' },
  { keys: ['?'], label: 'This sheet' },
  { keys: ['Esc'], label: 'Close any dialog' },
]

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="min-w-[1.6rem] rounded border border-retro-dark/20 bg-background/70 px-1.5 py-0.5 text-center font-mono text-[11px] text-retro-dark">
      {children}
    </kbd>
  )
}

/** Keyboard reference, opened with `?`. */
export function ShortcutsSheet({ open, onClose }: ShortcutsSheetProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Keyboard shortcuts" size="lg">
      <div className="grid gap-6 sm:grid-cols-2" data-testid="shortcuts-sheet">
        <section>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-retro-dark/50">
            Global
          </p>
          <ul className="space-y-2">
            {GLOBAL.map((s) => (
              <li
                key={s.label}
                className="flex items-center justify-between text-sm text-retro-dark"
              >
                <span>{s.label}</span>
                <span className="flex gap-1">
                  {s.keys.map((k) => (
                    <Key key={k}>{k}</Key>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-retro-dark/50">
            Go to (press G, then…)
          </p>
          <ul className="space-y-2">
            {Object.entries(GOTO_CHORDS).map(([key, href]) => (
              <li key={key} className="flex items-center justify-between text-sm text-retro-dark">
                <span>{NAV_ITEMS_BY_HREF[href]?.label ?? href}</span>
                <span className="flex gap-1">
                  <Key>G</Key>
                  <Key>{key.toUpperCase()}</Key>
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="sm:col-span-2">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-retro-dark/50">
            Capture syntax
          </p>
          <p className="text-sm text-retro-dark/80">
            <code className="rounded bg-retro-dark/5 px-1">
              Call bank tomorrow #finance !high @Fitness
            </code>{' '}
            → a task due tomorrow, tagged finance, high priority, linked to your Fitness goal.
            Dates: today, tomorrow, friday, next week, in 3 days, 25/12, 2026-11-01. Start with{' '}
            <code className="rounded bg-retro-dark/5 px-1">note:</code> to capture a note instead.
          </p>
        </section>
      </div>
    </Dialog>
  )
}
