'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Coffee, Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFocusStore } from '@/stores/focus-store'
import { useEndFocusSession, useStartFocusSession } from '@/hooks/use-focus-sessions'
import { useToast } from '@/hooks/use-toast'
import { WORK_SEC, formatClock, remainingSeconds } from '@/lib/focus/timer'
import { cn } from '@/lib/utils'

interface PomodoroTimerProps {
  className?: string
  taskId?: string | null
  taskTitle?: string | null
}

function useBeep() {
  const ctxRef = useRef<AudioContext | null>(null)
  return useCallback(() => {
    try {
      const ctx = ctxRef.current ?? new AudioContext()
      ctxRef.current = ctx
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 800
      gain.gain.value = 0.25
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    } catch {
      /* audio unavailable */
    }
  }, [])
}

/**
 * Pomodoro timer backed by the persisted focus store. Work sessions are
 * recorded on the server so the day's deep-work minutes show up on Home
 * and in the evening review.
 */
export function PomodoroTimer({ className, taskId = null, taskTitle = null }: PomodoroTimerProps) {
  const store = useFocusStore()
  const startSession = useStartFocusSession()
  const endSession = useEndFocusSession()
  const toast = useToast()
  const beep = useBeep()
  const [now, setNow] = useState(() => Date.now())
  const finishing = useRef(false)

  useEffect(() => {
    if (store.phase !== 'running') return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [store.phase])

  const remaining = remainingSeconds(store, now)
  const progress = store.plannedSec > 0 ? 1 - remaining / store.plannedSec : 0

  const beginWork = useCallback(async () => {
    const started = Date.now()
    store.start({ kind: 'work', plannedSec: WORK_SEC, taskId, taskTitle }, started)
    try {
      const session = await startSession.mutateAsync({ taskId, kind: 'work' })
      useFocusStore.getState().setSessionId(session.id)
    } catch {
      toast.show('Timer running, but the session could not be saved', 'error')
    }
  }, [store, startSession, taskId, taskTitle, toast])

  const beginBreak = useCallback(() => {
    const sec = useFocusStore.getState().nextBreakSec()
    store.start({ kind: 'break', plannedSec: sec, taskId, taskTitle }, Date.now())
  }, [store, taskId, taskTitle])

  const finishCurrent = useCallback(
    async (completed: boolean) => {
      const s = useFocusStore.getState()
      if (s.kind === 'work' && s.sessionId) {
        try {
          const ended = await endSession.mutateAsync({ id: s.sessionId, completed })
          if (ended.durationSec >= 60) {
            toast.show(`${Math.round(ended.durationSec / 60)} min of deep work logged`)
          }
        } catch {
          /* best effort */
        }
      }
      if (s.kind === 'work' && completed) s.completePomodoro()
    },
    [endSession, toast]
  )

  // Auto-advance when the segment ends.
  useEffect(() => {
    if (store.phase !== 'running' || remaining > 0 || finishing.current) return
    finishing.current = true
    beep()
    const wasWork = store.kind === 'work'
    void finishCurrent(true).then(() => {
      if (wasWork) beginBreak()
      else useFocusStore.getState().stop()
      finishing.current = false
    })
  }, [remaining, store.phase, store.kind, beep, finishCurrent, beginBreak])

  const reset = async () => {
    await finishCurrent(false)
    store.stop()
  }

  const skip = async () => {
    const wasWork = store.kind === 'work'
    await finishCurrent(false)
    if (wasWork) beginBreak()
    else store.stop()
  }

  // Keyboard: space toggles, r resets
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        const s = useFocusStore.getState()
        if (s.phase === 'idle') void beginWork()
        else if (s.phase === 'running') s.pause()
        else s.resume()
      } else if (e.code === 'KeyR' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        void reset()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beginWork])

  const size = 220
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  const label =
    store.phase === 'idle'
      ? 'Ready'
      : store.phase === 'paused'
        ? 'Paused'
        : store.kind === 'break'
          ? 'Break'
          : 'Focus'
  const ring =
    store.kind === 'break'
      ? 'stroke-retro-mint'
      : store.phase === 'paused'
        ? 'stroke-retro-yellow'
        : 'stroke-retro-blue'

  return (
    <div className={cn('flex flex-col items-center gap-5', className)} data-testid="focus-timer">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-retro-dark/10"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference * (1 - progress) }}
            transition={{ type: 'spring', stiffness: 60, damping: 20 }}
            className={cn('transition-colors duration-300', ring)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-5xl font-bold tabular-nums text-retro-dark">
            {formatClock(remaining)}
          </span>
          <span className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-retro-dark/50">
            {label}
          </span>
          {store.pomodoroCount > 0 && (
            <span className="mt-2 flex gap-1" aria-label={`${store.pomodoroCount} pomodoros today`}>
              {Array.from({ length: Math.min(store.pomodoroCount, 8) }).map((_, i) => (
                <span key={i} className="h-1.5 w-1.5 rounded-full bg-retro-pink" />
              ))}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {store.phase === 'idle' ? (
          <Button onClick={() => void beginWork()} size="lg" data-testid="focus-start">
            <Play className="mr-2 h-4 w-4" />
            Start 25 min
          </Button>
        ) : (
          <>
            <Button
              onClick={() => (store.phase === 'running' ? store.pause() : store.resume())}
              variant="outline"
              size="lg"
              data-testid="focus-pause"
            >
              {store.phase === 'paused' ? (
                <>
                  <Play className="mr-2 h-4 w-4" /> Resume
                </>
              ) : (
                <>
                  <Pause className="mr-2 h-4 w-4" /> Pause
                </>
              )}
            </Button>
            <Button
              onClick={() => void skip()}
              variant="ghost"
              size="lg"
              title="Skip to the next segment"
            >
              {store.kind === 'work' ? (
                <Coffee className="h-4 w-4" />
              ) : (
                <SkipForward className="h-4 w-4" />
              )}
            </Button>
            <Button onClick={() => void reset()} variant="ghost" size="lg" title="Reset (r)">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      <p className="font-mono text-[11px] text-retro-dark/40">space start/pause · r reset</p>
    </div>
  )
}
