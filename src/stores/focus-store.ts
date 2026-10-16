import { create } from 'zustand'
import {
  LONG_BREAK_SEC,
  POMODOROS_PER_LONG_BREAK,
  SHORT_BREAK_SEC,
  WORK_SEC,
  type TimerPhase,
} from '@/lib/focus/timer'
import type { FocusKind } from '@/lib/types/focus'

const STORAGE_KEY = 'nobrainy-focus-timer'

interface PersistedFocus {
  phase: TimerPhase
  kind: FocusKind
  startedAt: number | null
  accumulatedSec: number
  plannedSec: number
  taskId: string | null
  taskTitle: string | null
  sessionId: string | null
  pomodoroCount: number
}

interface FocusState extends PersistedFocus {
  start: (
    opts: {
      kind: FocusKind
      plannedSec?: number
      taskId?: string | null
      taskTitle?: string | null
      sessionId?: string | null
    },
    now?: number
  ) => void
  pause: (now?: number) => void
  resume: (now?: number) => void
  stop: () => void
  completePomodoro: () => void
  nextBreakSec: () => number
  setSessionId: (id: string | null) => void
  reset: () => void
}

const initial: PersistedFocus = {
  phase: 'idle',
  kind: 'work',
  startedAt: null,
  accumulatedSec: 0,
  plannedSec: WORK_SEC,
  taskId: null,
  taskTitle: null,
  sessionId: null,
  pomodoroCount: 0,
}

function load(): PersistedFocus {
  if (typeof window === 'undefined') return initial
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initial
    const parsed = JSON.parse(raw) as Partial<PersistedFocus>
    return { ...initial, ...parsed }
  } catch {
    return initial
  }
}

function persist(state: PersistedFocus): void {
  if (typeof window === 'undefined') return
  try {
    const {
      phase,
      kind,
      startedAt,
      accumulatedSec,
      plannedSec,
      taskId,
      taskTitle,
      sessionId,
      pomodoroCount,
    } = state
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        phase,
        kind,
        startedAt,
        accumulatedSec,
        plannedSec,
        taskId,
        taskTitle,
        sessionId,
        pomodoroCount,
      })
    )
  } catch {
    /* storage unavailable */
  }
}

/**
 * Pomodoro timer state that survives navigation and reloads. Time is derived
 * from `startedAt` and the wall clock, so there is no drifting interval.
 */
export const useFocusStore = create<FocusState>((set, get) => ({
  ...load(),
  start: (opts, now = Date.now()) => {
    const next: PersistedFocus = {
      ...get(),
      phase: 'running',
      kind: opts.kind,
      startedAt: now,
      accumulatedSec: 0,
      plannedSec: opts.plannedSec ?? (opts.kind === 'work' ? WORK_SEC : get().nextBreakSec()),
      taskId: opts.taskId ?? null,
      taskTitle: opts.taskTitle ?? null,
      sessionId: opts.sessionId ?? null,
    }
    persist(next)
    set(next)
  },
  pause: (now = Date.now()) => {
    const s = get()
    if (s.phase !== 'running' || s.startedAt == null) return
    const next: PersistedFocus = {
      ...s,
      phase: 'paused',
      accumulatedSec: Math.floor(s.accumulatedSec + (now - s.startedAt) / 1000),
      startedAt: null,
    }
    persist(next)
    set(next)
  },
  resume: (now = Date.now()) => {
    const s = get()
    if (s.phase !== 'paused') return
    const next: PersistedFocus = { ...s, phase: 'running', startedAt: now }
    persist(next)
    set(next)
  },
  stop: () => {
    const next: PersistedFocus = {
      ...get(),
      phase: 'idle',
      startedAt: null,
      accumulatedSec: 0,
      plannedSec: WORK_SEC,
      kind: 'work',
      sessionId: null,
    }
    persist(next)
    set(next)
  },
  completePomodoro: () => {
    const next = { ...get(), pomodoroCount: get().pomodoroCount + 1 }
    persist(next)
    set({ pomodoroCount: next.pomodoroCount })
  },
  nextBreakSec: () =>
    get().pomodoroCount > 0 && get().pomodoroCount % POMODOROS_PER_LONG_BREAK === 0
      ? LONG_BREAK_SEC
      : SHORT_BREAK_SEC,
  setSessionId: (id) => {
    const next = { ...get(), sessionId: id }
    persist(next)
    set({ sessionId: id })
  },
  reset: () => {
    persist(initial)
    set(initial)
  },
}))
