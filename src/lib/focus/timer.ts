export const WORK_SEC = 25 * 60
export const SHORT_BREAK_SEC = 5 * 60
export const LONG_BREAK_SEC = 15 * 60
export const POMODOROS_PER_LONG_BREAK = 4

/** Open sessions older than this are assumed abandoned. */
export const STALE_GRACE_MS = 2 * 60 * 60 * 1000

export type TimerPhase = 'idle' | 'running' | 'paused'

export interface TimerSnapshot {
  phase: TimerPhase
  /** Wall-clock ms when the current running segment began. */
  startedAt: number | null
  /** Seconds elapsed in earlier segments before the latest pause. */
  accumulatedSec: number
  plannedSec: number
}

/** Seconds elapsed so far, derived from the wall clock so navigation never drifts it. */
export function elapsedSeconds(state: TimerSnapshot, now: number): number {
  const running =
    state.phase === 'running' && state.startedAt != null ? (now - state.startedAt) / 1000 : 0
  return Math.max(0, Math.floor(state.accumulatedSec + running))
}

/** Seconds left on the current segment, never below zero. */
export function remainingSeconds(state: TimerSnapshot, now: number): number {
  return Math.max(0, state.plannedSec - elapsedSeconds(state, now))
}

/** `mm:ss`, minutes unbounded. */
export function formatClock(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * When an open session was started more than the grace period ago, the
 * end to record for it: one standard pomodoro after it began. Otherwise null.
 */
export function staleSessionEnd(startedAt: Date, now: Date): Date | null {
  if (now.getTime() - startedAt.getTime() < STALE_GRACE_MS) return null
  return new Date(startedAt.getTime() + WORK_SEC * 1000)
}
