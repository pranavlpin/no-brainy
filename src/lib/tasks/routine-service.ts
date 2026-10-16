import type { Prisma, Task } from '@prisma/client'
import { addCalendarDays } from '@/lib/dates/calendar'
import { nextOccurrence, supportedRecurrence } from './recurrence'

/** Attach supported legacy/new recurrence to a stable root and original calendar anchor. */
export async function initializeRoutine(
  db: Prisma.TransactionClient,
  task: Task,
  today: string
): Promise<Task> {
  if (!task.isRecurring || !supportedRecurrence(task.rrule) || task.routineId) return task
  const anchor = task.plannedDate ?? task.dueDate ?? new Date(`${today}T00:00:00Z`)
  return db.task.update({
    where: { id: task.id },
    data: { routineId: task.id, occurrenceDate: anchor, recurrenceAnchor: anchor },
  })
}

/** Advance atomically with the completion transaction; the unique root/date key makes retries idempotent. */
export async function advanceRoutine(
  db: Prisma.TransactionClient,
  original: Task,
  today: string,
  resume = false
): Promise<Task | null> {
  if (!original.isRecurring || !supportedRecurrence(original.rrule)) return null
  const task = await initializeRoutine(db, original, today)
  const root = await db.task.findFirst({ where: { id: task.routineId!, userId: task.userId } })
  if (!root || root.routinePaused || !root.isRecurring || !supportedRecurrence(root.rrule))
    return null
  const existing = await db.task.findFirst({
    where: {
      routineId: root.id,
      userId: task.userId,
      status: { in: ['pending', 'in_progress'] },
      id: { not: task.id },
    },
  })
  if (existing) return existing
  const anchor = (root.recurrenceAnchor ?? root.dueDate ?? root.createdAt)
    .toISOString()
    .slice(0, 10)
  const occurrence = (task.occurrenceDate ?? task.plannedDate ?? task.dueDate ?? task.createdAt)
    .toISOString()
    .slice(0, 10)
  const cutoff = [occurrence, resume ? addCalendarDays(today, -1) : today].sort().at(-1)!
  const next = nextOccurrence({ rule: root.rrule!, anchor, after: cutoff })
  if (!next) return null
  const date = new Date(`${next}T00:00:00Z`)
  return db.task.upsert({
    where: { routineId_occurrenceDate: { routineId: root.id, occurrenceDate: date } },
    update: {},
    create: {
      userId: task.userId,
      title: task.title,
      descriptionMd: task.descriptionMd,
      priority: task.priority,
      tags: task.tags,
      goalId: task.goalId,
      projectId: task.projectId,
      context: task.context,
      estimatedMinutes: task.estimatedMinutes,
      effort: task.effort,
      quadrant: task.quadrant,
      isRecurring: true,
      rrule: root.rrule,
      routineId: root.id,
      recurrenceAnchor: root.recurrenceAnchor,
      occurrenceDate: date,
      plannedDate: date,
      dueDate: task.dueDate ? date : null,
    },
  })
}
