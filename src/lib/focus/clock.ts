export interface FocusClock {
  state: string
  accumulatedSeconds: number
  plannedSeconds: number
  activeSince: string | Date | null
}
/** Derive elapsed active work from timestamps, capped at the chosen duration; paused time never counts. */
export function elapsedSeconds(session: FocusClock, now = Date.now()): number {
  const additional =
    session.state === 'running' && session.activeSince
      ? Math.max(0, Math.floor((now - new Date(session.activeSince).getTime()) / 1000))
      : 0
  return Math.min(session.plannedSeconds, Math.max(0, session.accumulatedSeconds + additional))
}
/** Format a nonnegative duration without a ticking screen-reader announcement. */
export function timerLabel(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}
