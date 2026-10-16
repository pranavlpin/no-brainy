/**
 * Growth arithmetic. Task completion and measured outcomes are kept apart:
 * finishing every task never implies the outcome moved, and a measurement
 * only counts when the goal says where it started and where it should land.
 *
 * Ported from the owner's acceptance branch (`test/product-final-acceptance`,
 * NB-09) and simplified: practice is counted in distinct local days.
 */
import { addDays, dateKeyFromDate } from '@/lib/dates'

export interface ProgressGoal {
  category?: string | null
  baseline?: number | null
  target?: number | null
  taskCount?: number
  completedTaskCount?: number
}

/** 0..100 distance from baseline to target, or null when it cannot be known. */
export function outcomePercent(goal: ProgressGoal, measurement: number | null): number | null {
  if (goal.category === 'financial') return null
  if (measurement == null || goal.baseline == null || goal.target == null) return null
  if (goal.baseline === goal.target) return null
  const pct = ((measurement - goal.baseline) / (goal.target - goal.baseline)) * 100
  return Math.max(0, Math.min(100, Math.round(pct)))
}

export function growthProgress(goal: ProgressGoal, measurement: number | null) {
  const taskPercent =
    (goal.taskCount ?? 0) > 0
      ? Math.round(((goal.completedTaskCount ?? 0) / goal.taskCount!) * 100)
      : 0
  return { taskPercent, outcomePercent: outcomePercent(goal, measurement), measurement }
}

export interface PracticeSessionLike {
  /** ISO instant the session ended, or null while open. */
  endedAt: string | null
  outcome: string | null
}

export interface PracticeEvidenceLike {
  /** Calendar key the observation is about. */
  observedAt: string
  kind: string
}

const PRODUCTIVE = new Set(['completed', 'progress'])

/**
 * Distinct local days in the week (Monday `weekStart`, seven days) with a
 * practice observation or a productive focus session. Rest, skips, and
 * blocked sessions are recorded but never counted.
 */
export function practiceDays(input: {
  weekStart: string
  timezone: string
  sessions: PracticeSessionLike[]
  evidence: PracticeEvidenceLike[]
}): number {
  const end = addDays(input.weekStart, 7)
  const inWeek = (key: string) => key >= input.weekStart && key < end
  const days = new Set<string>()
  for (const s of input.sessions) {
    if (!s.endedAt || !PRODUCTIVE.has(s.outcome ?? '')) continue
    const key = dateKeyFromDate(new Date(s.endedAt), input.timezone)
    if (inWeek(key)) days.add(key)
  }
  for (const e of input.evidence) {
    if (e.kind !== 'practice') continue
    const key = e.observedAt.slice(0, 10)
    if (inWeek(key)) days.add(key)
  }
  return days.size
}
