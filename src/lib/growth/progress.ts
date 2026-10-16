import { addCalendarDays, todayInTimezone } from '@/lib/dates/calendar'
export interface ProgressGoal {
  category?: string | null
  baseline?: number | null
  target?: number | null
  taskCount?: number
  completedTaskCount?: number
}
/** Keep action completion separate from measured outcomes; financial tracking uses its own explicit amount calculation. */
export function growthProgress(goal: ProgressGoal, measurement: number | null) {
  const taskPercent =
    (goal.taskCount ?? 0) > 0
      ? Math.round(((goal.completedTaskCount ?? 0) / goal.taskCount!) * 100)
      : 0
  const outcomePercent =
    goal.category === 'financial' ||
    measurement === null ||
    goal.baseline == null ||
    goal.target == null ||
    goal.baseline === goal.target
      ? null
      : Math.max(
          0,
          Math.min(
            100,
            Math.round(((measurement - goal.baseline) / (goal.target - goal.baseline)) * 100)
          )
        )
  return { taskPercent, outcomePercent, measurement }
}
export interface PracticeTask {
  id: string
  routineId: string | null
  occurrenceDate: string | null
  completedAt: string | null
  status: string
}
export interface PracticeSession {
  id: string
  completedAt: string | null
  outcome: string | null
  task: PracticeTask | null
}
export interface PracticeEvidence {
  id: string
  observedAt: string
  kind: string
  practiceKey: string | null
}
/** Calendar Monday for the week containing the supplied date-only value. */
export function weekStartFor(date: string): string {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay()
  return addCalendarDays(date, -((day + 6) % 7))
}
/** A routine occurrence shares one identity with every linked session/evidence item. */
export function practiceIdentity(task: PracticeTask | null, sessionId?: string): string | null {
  if (task?.routineId && task.occurrenceDate)
    return `routine:${task.routineId}:${task.occurrenceDate.slice(0, 10)}`
  return sessionId ? `session:${sessionId}` : null
}
/** Count canonical practice identities in an account-local calendar week, excluding rest, skip and blocked outcomes. */
export function practiceCount(input: {
  weekStart: string
  timezone: string
  tasks: PracticeTask[]
  sessions: PracticeSession[]
  evidence: PracticeEvidence[]
}): number {
  const end = addCalendarDays(input.weekStart, 7)
  const inWeek = (date: string) => date >= input.weekStart && date < end
  const instantInWeek = (timestamp: string | null) =>
    !!timestamp && inWeek(todayInTimezone(input.timezone, new Date(timestamp)))
  const keys = new Set<string>()
  for (const task of input.tasks) {
    const key = practiceIdentity(task)
    if (key && task.status === 'completed' && instantInWeek(task.completedAt)) keys.add(key)
  }
  for (const session of input.sessions) {
    const key = practiceIdentity(session.task, session.id)
    if (
      key &&
      ['completed', 'progress'].includes(session.outcome ?? '') &&
      instantInWeek(session.completedAt)
    )
      keys.add(key)
  }
  for (const item of input.evidence)
    if (item.kind === 'practice' && inWeek(item.observedAt.slice(0, 10)))
      keys.add(item.practiceKey ?? `evidence:${item.id}`)
  return keys.size
}
