'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Pause, Play, Timer } from 'lucide-react'
import { useFocusStore } from '@/stores/focus-store'
import { useUIStore } from '@/stores/ui-store'
import { formatClock, remainingSeconds } from '@/lib/focus/timer'
import { cn } from '@/lib/utils'

/** Compact running timer shown in the top bar while a session is active outside focus mode. */
export function FocusPill() {
  const phase = useFocusStore((s) => s.phase)
  const kind = useFocusStore((s) => s.kind)
  const taskTitle = useFocusStore((s) => s.taskTitle)
  const taskId = useFocusStore((s) => s.taskId)
  const enterFocusMode = useUIStore((s) => s.enterFocusMode)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (phase === 'idle') return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [phase])

  if (phase === 'idle') return null

  const remaining = remainingSeconds(useFocusStore.getState(), now)
  const lastMinute = remaining <= 60 && phase === 'running'

  return (
    <motion.button
      type="button"
      data-testid="focus-pill"
      aria-live="polite"
      onClick={() => enterFocusMode(taskId ?? '')}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs font-bold transition-colors',
        kind === 'break'
          ? 'border-retro-mint/50 bg-retro-mint/15 text-retro-dark'
          : 'border-retro-blue/40 bg-retro-blue/10 text-retro-dark',
        lastMinute && 'animate-pulse-soft'
      )}
      title="Back to focus mode"
    >
      {phase === 'paused' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      <span className="tabular-nums">{formatClock(remaining)}</span>
      <Timer className="h-3.5 w-3.5 text-retro-dark/40" />
      {taskTitle && (
        <span className="hidden max-w-[160px] truncate font-sans font-medium sm:inline">
          {taskTitle}
        </span>
      )}
    </motion.button>
  )
}
