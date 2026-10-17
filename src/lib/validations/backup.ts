/**
 * Core backup format, version 1.
 *
 * Ported from the owner's acceptance branch (`test/product-final-acceptance`,
 * NB-13) and adapted to this branch's models. Every row schema is a strict
 * allowlist: owners, credentials, API keys, and public share tokens can never
 * appear in a backup, and anything unexpected fails validation.
 */
import { z } from 'zod'
import { isValidDateKey } from '@/lib/dates'

export const BACKUP_MAX_BYTES = 10 * 1024 * 1024
export const BACKUP_MAX_RECORDS = 20000

const id = z.string().min(1).max(200)
const text = z.string().max(1_000_000)
const short = z.string().max(1000)
const timestamp = z.string().datetime()
const dateKey = z.string().refine(isValidDateKey, 'Invalid calendar date')
const nullableId = id.nullable()
const number = z.number().finite()
const count = number.int().nonnegative().max(2_147_483_647)
const tags = z.array(short).max(1000)
const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
const stamped = { id, createdAt: timestamp, updatedAt: timestamp }
const created = { id, createdAt: timestamp }

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
  .refine((b) => b.startTime < b.endTime, 'Block ends before it starts')

export const coreSchemas = {
  captures: z
    .object({
      ...stamped,
      content: text,
      sourceUrl: text.nullable(),
      state: z.enum(['inbox', 'someday', 'processed', 'archived']),
      destinationType: z.enum(['task', 'note', 'bookmark']).nullable(),
      destinationId: nullableId,
      processedAt: timestamp.nullable(),
    })
    .strict(),
  goals: z
    .object({
      ...stamped,
      title: short,
      description: text,
      category: short.nullable(),
      targetDate: dateKey.nullable(),
      startDate: dateKey.nullable(),
      expenseTag: short.nullable(),
      targetAmount: z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/)
        .nullable(),
      status: z.enum(['active', 'completed', 'paused', 'abandoned']),
      successCriteria: text,
      baseline: number.nullable(),
      target: number.nullable(),
      unit: short.nullable(),
      weeklyPracticeTarget: count.max(14).nullable(),
    })
    .strict(),
  projects: z
    .object({
      ...stamped,
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
      ...stamped,
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
      ...stamped,
      title: short,
      descriptionMd: text,
      parentTaskId: nullableId,
      projectId: nullableId,
      goalId: nullableId,
      plannedDate: dateKey.nullable(),
      dueDate: dateKey.nullable(),
      estimatedMinutes: count.max(1440).nullable(),
      effort: z.enum(['light', 'steady', 'deep']).nullable(),
      context: z.enum(['work', 'personal']).nullable(),
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
  dayPlans: z
    .object({
      ...created,
      planDate: dateKey,
      focusTaskIds: z.array(id).max(3),
      timeBlocks: z.array(block).max(100),
      aiBriefMd: text.nullable(),
      intentMd: text.nullable(),
      availableMinutes: count.max(1440),
      bufferMinutes: count.max(1440),
      workStart: time.nullable(),
      workEnd: time.nullable(),
    })
    .strict(),
  dailyReviews: z
    .object({
      ...created,
      reviewDate: dateKey,
      tasksCompleted: count,
      tasksMissed: count,
      notesCreated: count,
      cardsReviewed: count,
      reflectionMd: text,
      aiSummaryMd: text.nullable(),
      mood: short.nullable(),
      tomorrowIntent: short.nullable(),
    })
    .strict(),
  weeklyReviews: z
    .object({
      ...stamped,
      weekStart: dateKey,
      stopDoing: text,
      keepDoing: text,
      startTrying: text,
      reflectionMd: text,
      outcomes: z.array(z.object({ id: short, text: short }).strict()).max(3),
      nextTaskId: nullableId,
      closedAt: timestamp.nullable(),
    })
    .strict(),
  focusSessions: z
    .object({
      ...created,
      taskId: nullableId,
      kind: z.enum(['work', 'break']),
      startedAt: timestamp,
      endedAt: timestamp.nullable(),
      durationSec: count,
      completed: z.boolean(),
      intention: text,
      outcome: z.enum(['completed', 'progress', 'blocked']).nullable(),
      reflection: text,
      nextAction: short.nullable(),
      nextActionTaskId: nullableId,
    })
    .strict(),
  growthEvidence: z
    .object({
      ...stamped,
      goalId: id,
      observedAt: dateKey,
      summary: text,
      measurement: number.nullable(),
      kind: z.enum(['reflection', 'practice', 'rest', 'skip']),
      sourceType: z.enum(['note', 'project', 'session']).nullable(),
      sourceId: nullableId,
      sourceTitle: text.nullable(),
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

/** Which table a polymorphic link type points at. */
export const LINK_TARGETS = {
  task: 'tasks',
  note: 'notes',
  project: 'projects',
  goal: 'goals',
  session: 'focusSessions',
} as const

/**
 * Parse a bounded backup and verify every internal reference before any
 * database write. Throws a plain Error with a readable message.
 */
export function parseBackup(raw: string | unknown): CoreBackup {
  const asText = typeof raw === 'string' ? raw : JSON.stringify(raw)
  if (new TextEncoder().encode(asText).length > BACKUP_MAX_BYTES) {
    throw new Error('Backup is too large. Maximum 10 MB.')
  }
  const backup = backupSchema.parse(typeof raw === 'string' ? JSON.parse(raw) : raw)
  const { data } = backup
  const total = Object.values(data).reduce((sum, rows) => sum + rows.length, 0)
  if (total > BACKUP_MAX_RECORDS) throw new Error('Backup contains too many records.')

  const ids = {} as Record<CoreTable, Set<string>>
  for (const [table, rows] of Object.entries(data) as [CoreTable, { id?: string }[]][]) {
    const list = rows.flatMap((r) => (r.id ? [r.id] : []))
    if (new Set(list).size !== list.length) throw new Error(`Duplicate id in ${table}`)
    ids[table] = new Set(list)
  }
  const ref = (table: CoreTable, value: string | null | undefined) => {
    if (value && !ids[table].has(value)) throw new Error(`Invalid ${table} reference`)
  }

  const taskById = new Map(data.tasks.map((t) => [t.id, t]))
  for (const t of data.tasks) {
    ref('tasks', t.parentTaskId)
    ref('projects', t.projectId)
    ref('goals', t.goalId)
    const seen = new Set<string>()
    let cur: string | null = t.id
    while (cur) {
      if (seen.has(cur)) throw new Error('Task parent cycle')
      seen.add(cur)
      cur = taskById.get(cur)?.parentTaskId ?? null
    }
  }
  for (const p of data.projects) {
    ref('goals', p.goalId)
    ref('tasks', p.nextActionId)
  }
  for (const l of data.projectNotes) {
    ref('projects', l.projectId)
    ref('notes', l.noteId)
  }
  for (const l of data.taskLinks) {
    ref('tasks', l.taskId)
    ref(LINK_TARGETS[l.linkedType], l.linkedId)
  }
  for (const l of data.noteLinks) {
    ref('notes', l.sourceId)
    ref('notes', l.targetId)
  }
  for (const p of data.dayPlans) {
    if (!!p.workStart !== !!p.workEnd || (p.workStart && p.workEnd && p.workStart >= p.workEnd)) {
      throw new Error('Invalid working window')
    }
    p.focusTaskIds.forEach((t) => ref('tasks', t))
    p.timeBlocks.forEach((b) => ref('tasks', b.taskId))
    if (new Set(p.focusTaskIds).size !== p.focusTaskIds.length)
      throw new Error('Duplicate focus task')
    if (new Set(p.timeBlocks.map((b) => b.id)).size !== p.timeBlocks.length)
      throw new Error('Duplicate block id')
  }
  for (const r of data.weeklyReviews) ref('tasks', r.nextTaskId)
  for (const f of data.focusSessions) {
    ref('tasks', f.taskId)
    ref('tasks', f.nextActionTaskId)
  }
  for (const e of data.growthEvidence) {
    ref('goals', e.goalId)
    if (!!e.sourceType !== !!e.sourceId) throw new Error('Invalid evidence source')
    if (e.sourceType) ref(LINK_TARGETS[e.sourceType], e.sourceId)
  }
  for (const c of data.captures) {
    if (!!c.destinationId !== !!c.destinationType) throw new Error('Invalid capture destination')
    if (c.destinationType === 'bookmark') throw new Error('Bookmarks are outside the core backup')
    if (c.destinationType) ref(LINK_TARGETS[c.destinationType], c.destinationId)
  }
  for (const dates of [
    data.dayPlans.map((p) => p.planDate),
    data.dailyReviews.map((r) => r.reviewDate),
    data.weeklyReviews.map((r) => r.weekStart),
  ]) {
    if (new Set(dates).size !== dates.length) throw new Error('Duplicate calendar record')
  }
  for (const keys of [
    data.taskLinks.map((l) => JSON.stringify([l.taskId, l.linkedType, l.linkedId])),
    data.projectNotes.map((l) => JSON.stringify([l.projectId, l.noteId])),
    data.noteLinks.map((l) => JSON.stringify([l.sourceId, l.targetType, l.targetId])),
  ]) {
    if (new Set(keys).size !== keys.length) throw new Error('Duplicate link')
  }
  return backup
}
