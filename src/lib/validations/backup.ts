import { z } from 'zod'
import { calendarDate } from '@/lib/dates/calendar'

export const BACKUP_MAX_BYTES = 10 * 1024 * 1024
const id = z.string().min(1).max(200)
const text = z.string().max(1000000)
const short = z.string().max(1000)
const timestamp = z.string().datetime()
const date = z
  .string()
  .refine((v) => calendarDate(v) !== null, 'Invalid calendar date')
  .transform((v) => calendarDate(v)!)
const nullableId = id.nullable()
const number = z.number().finite()
const count = number.int().nonnegative().max(2147483647)
const tags = z.array(short).max(1000)
const base = { id, createdAt: timestamp, updatedAt: timestamp }
const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
const block = z
  .object({
    id,
    title: short,
    startTime: time,
    endTime: time,
    taskId: id.optional(),
    color: short.optional(),
    isCompleted: z.boolean().default(false),
  })
  .strict()
  .refine((b) => b.startTime < b.endTime)

/** Versioned field allowlists deliberately exclude owners, credentials and public share tokens. */
export const coreSchemas = {
  captures: z
    .object({
      ...base,
      content: text,
      sourceUrl: text.nullable(),
      state: z.enum(['inbox', 'someday', 'processed', 'archived']),
      destinationType: short.nullable(),
      destinationId: nullableId,
      processedAt: timestamp.nullable(),
    })
    .strict(),
  goals: z
    .object({
      ...base,
      title: short,
      description: text,
      successCriteria: text,
      baseline: number.nullable(),
      target: number.nullable(),
      unit: short.nullable(),
      weeklyPracticeTarget: count.max(21).nullable(),
      category: short.nullable(),
      targetDate: date.nullable(),
      startDate: date.nullable(),
      expenseTag: short.nullable(),
      targetAmount: z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/)
        .nullable(),
      status: z.enum(['active', 'completed', 'paused', 'abandoned']),
    })
    .strict(),
  projects: z
    .object({
      ...base,
      title: short,
      outcome: text,
      context: z.enum(['work', 'personal']),
      status: z.enum(['active', 'paused', 'completed', 'archived']),
      goalId: nullableId,
      nextActionId: nullableId,
    })
    .strict(),
  notes: z
    .object({
      ...base,
      title: text,
      contentMd: text,
      tags,
      isPinned: z.boolean(),
      isDeleted: z.boolean(),
      deletedAt: timestamp.nullable(),
      wordCount: count,
    })
    .strict(),
  tasks: z
    .object({
      ...base,
      title: short,
      descriptionMd: text,
      parentTaskId: nullableId,
      projectId: nullableId,
      goalId: nullableId,
      plannedDate: date.nullable(),
      dueDate: date.nullable(),
      estimatedMinutes: count.max(1440).nullable(),
      effort: z.enum(['light', 'steady', 'deep']).nullable(),
      context: z.enum(['work', 'personal']).nullable(),
      routineId: nullableId,
      occurrenceDate: date.nullable(),
      recurrenceAnchor: date.nullable(),
      routinePaused: z.boolean(),
      priority: z.enum(['urgent', 'high', 'medium', 'low']),
      status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
      tags,
      completedAt: timestamp.nullable(),
      isRecurring: z.boolean(),
      rrule: short.nullable(),
      quadrant: short.nullable(),
      orderIndex: number,
    })
    .strict(),
  taskLinks: z
    .object({ taskId: id, linkedType: z.enum(['note', 'task', 'project', 'goal']), linkedId: id })
    .strict(),
  projectNotes: z.object({ projectId: id, noteId: id }).strict(),
  noteLinks: z
    .object({ id, sourceId: id, targetType: z.literal('note'), targetId: id, createdAt: timestamp })
    .strict(),
  taskPlanEvents: z
    .object({
      id,
      taskId: nullableId,
      taskTitle: short,
      fromDate: date.nullable(),
      toDate: date.nullable(),
      createdAt: timestamp,
    })
    .strict(),
  dayPlans: z
    .object({
      ...base,
      planDate: date,
      focusTaskIds: z.array(id).max(3),
      timeBlocks: z.array(block).max(100),
      aiBriefMd: text.nullable(),
      mainOutcome: text,
      availableMinutes: count.max(1440),
      bufferMinutes: count.max(1440),
      workStart: time.nullable(),
      workEnd: time.nullable(),
      growthTaskId: nullableId,
    })
    .strict(),
  dailyReviews: z
    .object({
      ...base,
      reviewDate: date,
      tasksCompleted: count,
      tasksMissed: count,
      notesCreated: count,
      cardsReviewed: count,
      whatMoved: text,
      blockers: text,
      tomorrowTaskId: nullableId,
      closedAt: timestamp.nullable(),
      reflectionMd: text,
      aiSummaryMd: text.nullable(),
      mood: short.nullable(),
    })
    .strict(),
  weeklyReviews: z
    .object({
      ...base,
      weekStart: date,
      stopDoing: text,
      keepDoing: text,
      startTrying: text,
      reflectionMd: text,
      outcomes: z
        .array(z.object({ id: z.enum(['first', 'second', 'third']), text: short }).strict())
        .max(3),
      nextTaskId: nullableId,
      closedAt: timestamp.nullable(),
    })
    .strict(),
  focusSessions: z
    .object({
      id,
      taskId: nullableId,
      taskTitle: short,
      intention: text,
      state: z.enum(['running', 'paused', 'finished']),
      startedAt: timestamp,
      activeSince: timestamp.nullable(),
      accumulatedSeconds: count,
      plannedSeconds: count.min(60).max(10800),
      completedAt: timestamp.nullable(),
      outcome: z.enum(['completed', 'progress', 'blocked']).nullable(),
      reflection: text,
      nextAction: text,
      nextActionId: nullableId,
      updatedAt: timestamp,
    })
    .strict(),
  growthEvidence: z
    .object({
      ...base,
      goalId: id,
      observedAt: date,
      summary: text,
      measurement: number.nullable(),
      kind: z.enum(['reflection', 'practice', 'rest', 'skip']),
      sourceType: z.enum(['note', 'project', 'session']).nullable(),
      sourceId: nullableId,
      sourceTitle: text.nullable(),
      practiceKey: short.nullable(),
    })
    .strict(),
}
const dataSchema = z
  .object({
    captures: z.array(coreSchemas.captures),
    goals: z.array(coreSchemas.goals),
    projects: z.array(coreSchemas.projects),
    notes: z.array(coreSchemas.notes),
    tasks: z.array(coreSchemas.tasks),
    taskLinks: z.array(coreSchemas.taskLinks),
    projectNotes: z.array(coreSchemas.projectNotes),
    noteLinks: z.array(coreSchemas.noteLinks),
    taskPlanEvents: z.array(coreSchemas.taskPlanEvents),
    dayPlans: z.array(coreSchemas.dayPlans),
    dailyReviews: z.array(coreSchemas.dailyReviews),
    weeklyReviews: z.array(coreSchemas.weeklyReviews),
    focusSessions: z.array(coreSchemas.focusSessions),
    growthEvidence: z.array(coreSchemas.growthEvidence),
  })
  .strict()
export const backupSchema = z
  .object({
    version: z.literal(1),
    scope: z.literal('nobrainy-core'),
    exportedAt: timestamp,
    omittedLinks: count,
    data: dataSchema,
  })
  .strict()
export type CoreBackup = z.infer<typeof backupSchema>
export type CoreTable = keyof CoreBackup['data']

/** Parse a bounded portable core archive; verify every internal reference before any database write. */
export function parseBackup(raw: string | unknown): CoreBackup {
  const textValue = typeof raw === 'string' ? raw : JSON.stringify(raw)
  if (new TextEncoder().encode(textValue).length > BACKUP_MAX_BYTES)
    throw Error('Backup is too large. Maximum 10 MB.')
  const backup = backupSchema.parse(typeof raw === 'string' ? JSON.parse(raw) : raw)
  const { data } = backup
  if (Object.values(data).reduce((total, rows) => total + rows.length, 0) > 20000)
    throw Error('Backup contains too many records.')
  const sets = Object.fromEntries(
    Object.entries(data).map(([key, rows]) => [
      key,
      new Set(rows.flatMap((row) => ('id' in row ? [row.id] : []))),
    ])
  ) as Record<CoreTable, Set<string>>
  for (const [table, rows] of Object.entries(data)) {
    const ids = rows.flatMap((row) => ('id' in row ? [row.id] : []))
    if (new Set(ids).size !== ids.length) throw Error(`Duplicate identity in ${table}`)
  }
  const ref = (table: CoreTable, value: string | null | undefined) => {
    if (value && !sets[table].has(value)) throw Error(`Invalid ${table} reference`)
  }
  const targets = {
    task: 'tasks',
    note: 'notes',
    project: 'projects',
    goal: 'goals',
    session: 'focusSessions',
  } as const
  for (const t of data.tasks) {
    ref('tasks', t.parentTaskId)
    ref('tasks', t.routineId)
    ref('projects', t.projectId)
    ref('goals', t.goalId)
  }
  const taskMap = new Map(data.tasks.map((t) => [t.id, t]))
  for (const field of ['parentTaskId', 'routineId'] as const)
    for (const t of data.tasks) {
      const seen = new Set<string>()
      let current: string | null = t.id
      while (current) {
        if (seen.has(current)) throw Error('Task reference cycle')
        seen.add(current)
        const next: string | null = taskMap.get(current)?.[field] ?? null
        if (field === 'routineId' && next === current) break
        current = next
      }
    }
  for (const p of data.projects) {
    ref('goals', p.goalId)
    ref('tasks', p.nextActionId)
  }
  for (const p of data.projectNotes) {
    ref('projects', p.projectId)
    ref('notes', p.noteId)
  }
  for (const l of data.taskLinks) {
    ref('tasks', l.taskId)
    ref(targets[l.linkedType], l.linkedId)
  }
  for (const l of data.noteLinks) {
    ref('notes', l.sourceId)
    ref('notes', l.targetId)
  }
  for (const e of data.taskPlanEvents) ref('tasks', e.taskId)
  for (const p of data.dayPlans) {
    if (!!p.workStart !== !!p.workEnd || (p.workStart && p.workEnd && p.workStart >= p.workEnd))
      throw Error('Invalid working window')
    p.focusTaskIds.forEach((t) => ref('tasks', t))
    ref('tasks', p.growthTaskId)
    p.timeBlocks.forEach((b) => ref('tasks', b.taskId))
    if (
      new Set(p.focusTaskIds).size !== p.focusTaskIds.length ||
      new Set(p.timeBlocks.map((b) => b.id)).size !== p.timeBlocks.length
    )
      throw Error('Duplicate plan selection')
  }
  for (const r of data.dailyReviews) ref('tasks', r.tomorrowTaskId)
  for (const r of data.weeklyReviews) ref('tasks', r.nextTaskId)
  for (const f of data.focusSessions) {
    ref('tasks', f.taskId)
    ref('tasks', f.nextActionId)
  }
  for (const e of data.growthEvidence) {
    ref('goals', e.goalId)
    if (!!e.sourceType !== !!e.sourceId) throw Error('Invalid source reference')
    if (e.sourceType) ref(targets[e.sourceType], e.sourceId)
  }
  for (const c of data.captures) {
    if (!!c.destinationId !== !!c.destinationType) throw Error('Invalid capture reference')
    if (c.destinationType) {
      if (!(c.destinationType in targets)) throw Error('Invalid capture reference')
      ref(targets[c.destinationType as keyof typeof targets], c.destinationId)
    }
  }
  for (const dates of [
    data.dayPlans.map((p) => p.planDate),
    data.dailyReviews.map((r) => r.reviewDate),
    data.weeklyReviews.map((r) => r.weekStart),
  ])
    if (new Set(dates).size !== dates.length) throw Error('Duplicate calendar record')
  for (const identities of [
    data.taskLinks.map((l) => JSON.stringify([l.taskId, l.linkedType, l.linkedId])),
    data.projectNotes.map((l) => JSON.stringify([l.projectId, l.noteId])),
    data.noteLinks.map((l) => JSON.stringify([l.sourceId, l.targetType, l.targetId])),
  ])
    if (new Set(identities).size !== identities.length) throw Error('Duplicate link identity')
  const occurrences = data.tasks
    .filter((t) => t.routineId && t.occurrenceDate)
    .map((t) => JSON.stringify([t.routineId, t.occurrenceDate]))
  if (new Set(occurrences).size !== occurrences.length) throw Error('Duplicate routine occurrence')
  return backup
}
