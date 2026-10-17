'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Coffee, Flag, Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FinishDialog } from '@/components/focus/finish-dialog'
import { useFocusStore } from '@/stores/focus-store'
import { useEndFocusSession, useStartFocusSession } from '@/hooks/use-focus-sessions'
import { usePersonalSettings } from '@/hooks/use-personal-settings'
import { useToast } from '@/hooks/use-toast'
import { WORK_SEC, elapsedSeconds, formatClock, remainingSeconds } from '@/lib/focus/timer'
import { cn } from '@/lib/utils'
import type { FinishSessionInput } from '@/lib/types/focus'

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

const OUTCOME_TOAST = {
  completed: 'Completed. Task checked off.',
  progress: 'Progress logged. The task stays open.',
  blocked: 'Blocked, noted. Nothing lost.',
} as const

/**
 * Pomodoro timer backed by the persisted focus store. A work block begins
 * with an optional intention and ends with a result; only then does the
 * break start. Work sessions are recorded on the server so the day's
 * deep-work minutes and outcomes show on Home and in the evening review.
 */
export function PomodoroTimer({ className, taskId = null, taskTitle = null }: PomodoroTimerProps) {
  const store = useFocusStore()
  const startSession = useStartFocusSession()
  const endSession = useEndFocusSession()
  const toast = useToast()
  const chime = useBeep()
  const { data: personal } = usePersonalSettings()
  const soundOn = personal?.sound !== false
  const beep = useCallback(() => {
    if (soundOn) chime()
  }, [soundOn, chime])
  const [now, setNow] = useState(() => Date.now())
  const [intentionDraft, setIntentionDraft] = useState('')
  const [finishOpen, setFinishOpen] = useState(false)
  const [finishError, setFinishError] = useState<string | null>(null)
  const rangFor = useRef<number | null>(null)

  useEffect(() => {
    if (store.phase !== 'running') return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [store.phase])

  const remaining = remainingSeconds(store, now)
  const elapsed = elapsedSeconds(store, now)
  const progress = store.plannedSec > 0 ? 1 - remaining / store.plannedSec : 0
  const workDue = store.kind === 'work' && store.phase !== 'idle' && remaining <= 0

  const beginWork = useCallback(async () => {
    const started = Date.now()
    const intention = intentionDraft.trim()
    store.start({ kind: 'work', plannedSec: WORK_SEC, taskId, taskTitle, intention }, started)
    setIntentionDraft('')
    try {
      const session = await startSession.mutateAsync({ taskId, kind: 'work', intention })
      useFocusStore.getState().setSessionId(session.id)
    } catch {
      toast.show('Timer running, but the session could not be saved', 'error')
    }
  }, [store, startSession, taskId, taskTitle, toast, intentionDraft])

  const beginBreak = useCallback(() => {
    const sec = useFocusStore.getState().nextBreakSec()
    store.start({ kind: 'break', plannedSec: sec, taskId, taskTitle }, Date.now())
  }, [store, taskId, taskTitle])

  /** End the current segment without a result (reset or skip). */
  const abandonCurrent = useCallback(async () => {
    const s = useFocusStore.getState()
    if (s.kind === 'work' && s.sessionId) {
      try {
        await endSession.mutateAsync({ id: s.sessionId, completed: false })
      } catch {
        /* best effort */
      }
    }
  }, [endSession])

  // A work block that reaches zero pauses and asks for the result. A break
  // that reaches zero simply ends.
  useEffect(() => {
    if (store.phase !== 'running' || remaining > 0) return
    if (rangFor.current === store.startedAt) return
    rangFor.current = store.startedAt
    beep()
    if (store.kind === 'work') {
      store.pause()
      setFinishOpen(true)
    } else {
      useFocusStore.getState().stop()
    }
  }, [remaining, store, beep])

  // Coming back to a finished-but-unresolved block reopens the question.
  useEffect(() => {
    if (workDue && store.phase === 'paused' && !finishOpen) setFinishOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workDue])

  const finishWith = async (input: FinishSessionInput) => {
    const s = useFocusStore.getState()
    setFinishError(null)
    if (s.sessionId) {
      try {
        const ended = await endSession.mutateAsync({ id: s.sessionId, ...input })
        toast.show(OUTCOME_TOAST[input.outcome], input.outcome === 'completed' ? 'success' : 'info')
        if (ended.nextActionTaskId) toast.show('Next action added to your tasks')
      } catch {
        setFinishError('Could not save the result.')
        return
      }
    }
    s.completePomodoro()
    setFinishOpen(false)
    beginBreak()
  }

  const reset = async () => {
    await abandonCurrent()
    setFinishOpen(false)
    store.stop()
  }

  const skip = async () => {
    const wasWork = store.kind === 'work'
    if (wasWork) {
      // Skipping a work block still asks what happened.
      store.pause()
      setFinishOpen(true)
      return
    }
    store.stop()
  }

  // Keyboard: space toggles, r resets
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (finishOpen) return
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
  }, [beginWork, finishOpen])

  const size = 220
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  const label =
    store.phase === 'idle'
      ? 'Ready'
      : workDue
        ? 'Time. What happened?'
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
          <span className="mt-1 px-6 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-retro-dark/50">
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

      {store.phase === 'idle' ? (
        <div className="flex w-full max-w-sm flex-col items-center gap-3">
          <input
            data-testid="focus-intention"
            aria-label="Intention for this block"
            value={intentionDraft}
            onChange={(e) => setIntentionDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void beginWork()
              }
            }}
            maxLength={300}
            placeholder="In this block I will…"
            className="w-full border-0 border-b-2 border-retro-dark/15 bg-transparent px-1 py-1.5 text-center text-sm text-retro-dark placeholder:text-retro-dark/35 focus:border-retro-blue focus:outline-none"
          />
          <Button onClick={() => void beginWork()} size="lg" data-testid="focus-start">
            <Play className="mr-2 h-4 w-4" />
            Start 25 min
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          {store.intention && store.kind === 'work' && (
            <p
              className="max-w-sm text-center text-sm text-retro-dark/70"
              data-testid="focus-intention-shown"
            >
              {store.intention}
            </p>
          )}
          <div className="flex items-center gap-2">
            {!workDue && (
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
            )}
            {store.kind === 'work' ? (
              <Button
                onClick={() => {
                  store.pause()
                  setFinishOpen(true)
                }}
                variant={workDue ? 'default' : 'ghost'}
                size="lg"
                data-testid="focus-finish-button"
                title="Finish and record the result"
              >
                <Flag className="mr-2 h-4 w-4" />
                Finish
              </Button>
            ) : (
              <Button onClick={() => void skip()} variant="ghost" size="lg" title="End the break">
                <SkipForward className="h-4 w-4" />
              </Button>
            )}
            {store.kind === 'work' && !workDue && (
              <Button
                onClick={() => void skip()}
                variant="ghost"
                size="lg"
                title="Take a break now"
              >
                <Coffee className="h-4 w-4" />
              </Button>
            )}
            <Button onClick={() => void reset()} variant="ghost" size="lg" title="Reset (r)">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <p className="font-mono text-[11px] text-retro-dark/40">space start/pause · r reset</p>

      <FinishDialog
        open={finishOpen}
        taskTitle={store.taskTitle ?? taskTitle}
        intention={store.intention}
        elapsedSec={elapsed}
        isSaving={endSession.isPending}
        error={finishError}
        onFinish={(input) => void finishWith(input)}
        onClose={() => setFinishOpen(false)}
      />
    </div>
  )
}
