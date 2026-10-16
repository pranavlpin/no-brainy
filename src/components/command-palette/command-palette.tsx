'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Command } from 'cmdk'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  CheckSquare,
  CornerDownLeft,
  FileText,
  Layers,
  Moon,
  Plus,
  Search,
  Sunrise,
  SunMoon,
  Zap,
} from 'lucide-react'
import { NAV_ITEMS } from '@/lib/nav/items'
import { useCommandStore } from '@/stores/command-store'
import { useDarkModeStore } from '@/stores/dark-mode-store'
import { useGlobalSearch } from '@/hooks/use-search'
import type { SearchResult } from '@/lib/types/search'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const RESULT_HREF: Partial<Record<SearchResult['entityType'], (id: string) => string>> = {
  note: (id) => `/notes/${id}`,
  task: (id) => `/tasks/${id}`,
  book: (id) => `/books/${id}`,
  deck: (id) => `/flashcards/${id}`,
  flashcard: (id) => `/flashcards/${id}`,
  goal: (id) => `/goals/${id}`,
}

const RESULT_ICON: Partial<Record<SearchResult['entityType'], typeof FileText>> = {
  note: FileText,
  task: CheckSquare,
  book: BookOpen,
  deck: Layers,
  flashcard: Layers,
}

/** Simple scorer: exact substring wins, then in-order subsequence; search hits are never filtered. */
function score(value: string, search: string): number {
  if (value.startsWith('search:')) return 1
  const v = value.toLowerCase()
  const s = search.toLowerCase().trim()
  if (!s) return 1
  if (v.includes(s)) return 1
  let i = 0
  for (const ch of v) if (ch === s[i]) i++
  return i === s.length ? 0.4 : 0
}

/**
 * Cmd+K palette: navigate anywhere, run an action, or search notes and
 * tasks as you type.
 */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const openCapture = useCommandStore((s) => s.openCapture)
  const toggleDark = useDarkModeStore((s) => s.toggle)
  const [query, setQuery] = useState('')
  const { data: searchData } = useGlobalSearch(query.length >= 2 ? query : '', 'all')

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const close = () => onOpenChange(false)
  const go = (href: string) => {
    close()
    router.push(href)
  }

  const actions = useMemo(
    () => [
      {
        id: 'new-task',
        label: 'New task',
        hint: 'c',
        icon: Plus,
        keywords: 'create add todo capture',
        run: () => {
          close()
          openCapture({ kind: 'task' })
        },
      },
      {
        id: 'new-note',
        label: 'New note',
        icon: FileText,
        keywords: 'create write markdown',
        run: () => go('/notes/new'),
      },
      {
        id: 'plan-day',
        label: 'Plan the day',
        icon: Sunrise,
        keywords: 'morning triage focus planner',
        run: () => go('/planner'),
      },
      {
        id: 'close-day',
        label: 'Close the day',
        icon: Moon,
        keywords: 'review evening reflect nightly',
        run: () => go('/reviews/daily'),
      },
      {
        id: 'review-cards',
        label: 'Review flashcards',
        icon: Layers,
        keywords: 'study due spaced repetition',
        run: () => go('/flashcards'),
      },
      {
        id: 'toggle-dark',
        label: 'Toggle dark mode',
        icon: SunMoon,
        keywords: 'theme light appearance',
        run: () => {
          toggleDark()
          close()
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openCapture, toggleDark]
  )

  const results = searchData?.results.slice(0, 8) ?? []

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[70] bg-retro-dark/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount aria-label="Command palette">
              <motion.div
                data-testid="command-palette"
                className="fixed left-1/2 top-[14vh] z-[70] w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl surface-glass p-0 focus:outline-none"
                initial={{ opacity: 0, scale: 0.97, y: 6, x: '-50%' }}
                animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, scale: 0.98, y: 4, x: '-50%' }}
                transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">
                  Navigate, run an action, or search.
                </DialogPrimitive.Description>
                <Command label="Command palette" filter={score} loop>
                  <div className="flex items-center gap-2 border-b border-border/60 px-4">
                    <Search className="h-4 w-4 shrink-0 text-retro-dark/40" />
                    <Command.Input
                      autoFocus
                      value={query}
                      onValueChange={setQuery}
                      placeholder="Type a command or search…"
                      className="h-12 w-full bg-transparent text-sm text-retro-dark placeholder:text-retro-dark/40 focus:outline-none"
                    />
                    <kbd className="rounded border border-retro-dark/15 px-1.5 py-0.5 font-mono text-[10px] text-retro-dark/50">
                      esc
                    </kbd>
                  </div>
                  <Command.List className="max-h-[52vh] overflow-y-auto p-2">
                    <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
                      Nothing matches. Press{' '}
                      <kbd className="rounded border border-retro-dark/15 px-1 font-mono text-[10px]">
                        c
                      </kbd>{' '}
                      to capture it instead.
                    </Command.Empty>

                    <Command.Group heading="Actions" className="palette-group">
                      {actions.map((a) => (
                        <Command.Item
                          key={a.id}
                          value={`action ${a.label} ${a.keywords}`}
                          onSelect={a.run}
                          data-testid={`palette-item-action-${a.id}`}
                          className="palette-item"
                        >
                          <a.icon className="h-4 w-4 text-retro-pink" />
                          <span className="flex-1">{a.label}</span>
                          {a.hint && (
                            <kbd className="rounded border border-retro-dark/15 px-1.5 font-mono text-[10px] text-retro-dark/50">
                              {a.hint}
                            </kbd>
                          )}
                        </Command.Item>
                      ))}
                    </Command.Group>

                    <Command.Group heading="Go to" className="palette-group">
                      {NAV_ITEMS.map((item) => (
                        <Command.Item
                          key={item.href}
                          value={`nav ${item.label} ${(item.keywords ?? []).join(' ')}`}
                          onSelect={() => go(item.href)}
                          data-testid={`palette-item-nav-${item.href}`}
                          className="palette-item"
                        >
                          <item.icon className="h-4 w-4 text-retro-blue" />
                          <span className="flex-1">{item.label}</span>
                          <span className="font-mono text-[10px] text-retro-dark/40">
                            {item.href}
                          </span>
                        </Command.Item>
                      ))}
                    </Command.Group>

                    {results.length > 0 && (
                      <Command.Group heading="Search results" className="palette-group">
                        {results.map((r) => {
                          const Icon = RESULT_ICON[r.entityType] ?? Zap
                          const href = RESULT_HREF[r.entityType]?.(r.id) ?? '/search'
                          return (
                            <Command.Item
                              key={`${r.entityType}-${r.id}`}
                              value={`search:${r.entityType}:${r.id}`}
                              onSelect={() => go(href)}
                              data-testid={`palette-item-search-${r.id}`}
                              className="palette-item"
                            >
                              <Icon className="h-4 w-4 text-retro-mint" />
                              <span className="min-w-0 flex-1 truncate">{r.title}</span>
                              <span className="font-mono text-[10px] uppercase text-retro-dark/40">
                                {r.entityType}
                              </span>
                            </Command.Item>
                          )
                        })}
                      </Command.Group>
                    )}
                  </Command.List>
                  <div className="flex items-center justify-between border-t border-border/60 px-4 py-2 font-mono text-[10px] text-retro-dark/40">
                    <span className="flex items-center gap-1">
                      <CornerDownLeft className="h-3 w-3" /> run
                    </span>
                    <span>↑↓ move · esc close · ? all shortcuts</span>
                  </div>
                </Command>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
