'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useToast, type ToastItem } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const

const TONES = {
  success: 'border-retro-mint/60 text-retro-dark',
  error: 'border-retro-pink/70 text-retro-dark',
  info: 'border-retro-blue/60 text-retro-dark',
} as const

const ICON_TONES = {
  success: 'text-retro-mint',
  error: 'text-retro-pink',
  info: 'text-retro-blue',
} as const

function ToastRow({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const [paused, setPaused] = useState(false)
  const remaining = useRef(toast.durationMs)
  const startedAt = useRef<number>(Date.now())

  useEffect(() => {
    if (paused) return
    startedAt.current = Date.now()
    const timer = setTimeout(() => onDismiss(toast.id), remaining.current)
    return () => {
      clearTimeout(timer)
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current))
    }
  }, [paused, toast.id, onDismiss])

  const Icon = ICONS[toast.type]

  return (
    <motion.div
      layout
      data-testid={`toast-${toast.id}`}
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        'pointer-events-auto flex min-w-[260px] max-w-sm items-start gap-3 border-l-4 px-4 py-3 text-sm font-medium surface-glass rounded-xl',
        TONES[toast.type]
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', ICON_TONES[toast.type])} />
      <span className="flex-1 leading-snug">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick()
            onDismiss(toast.id)
          }}
          className="shrink-0 font-mono text-xs font-bold uppercase tracking-wide text-retro-blue hover:underline"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-retro-dark/40 transition-colors hover:text-retro-dark"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  )
}

/** Stacked, animated toast region. Mount once in the app shell. */
export function Toast() {
  const toasts = useToast((s) => s.toasts)
  const dismiss = useToast((s) => s.dismiss)

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2 pb-[env(safe-area-inset-bottom)]"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastRow key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}
