'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCommandStore } from '@/stores/command-store'
import { GOTO_CHORDS } from '@/lib/nav/items'

const CHORD_WINDOW_MS = 900

/** True when the key event originated inside something that takes text input. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (target.isContentEditable) return true
  if (target.closest('.cm-editor, [contenteditable="true"], [role="textbox"]')) return true
  return false
}

/**
 * Global keyboard shortcuts: mod+k palette, `c` capture, `?` help, and
 * `g` then a letter to jump between sections. Never fires while typing.
 */
export function ShortcutsProvider({ children }: { children?: React.ReactNode }) {
  const router = useRouter()
  const chordAt = useRef<number | null>(null)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const store = useCommandStore.getState()
      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        store.togglePalette()
        return
      }

      if (mod || e.altKey) return
      if (isTypingTarget(e.target)) return
      if (store.paletteOpen || store.captureOpen || store.helpOpen) return

      const now = Date.now()
      if (chordAt.current && now - chordAt.current < CHORD_WINDOW_MS) {
        chordAt.current = null
        const href = GOTO_CHORDS[e.key.toLowerCase()]
        if (href) {
          e.preventDefault()
          router.push(href)
          return
        }
      }

      switch (e.key) {
        case 'c':
          e.preventDefault()
          store.openCapture()
          break
        case '?':
          e.preventDefault()
          store.setHelp(true)
          break
        case 'g':
          chordAt.current = now
          break
        default:
          break
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [router])

  return <>{children}</>
}
