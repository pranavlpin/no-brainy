import { createHash, randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { coreSchemas, parseBackup, type CoreBackup, type CoreTable } from '@/lib/validations/backup'

const targets = {
  task: 'tasks',
  note: 'notes',
  project: 'projects',
  goal: 'goals',
  session: 'focusSessions',
} as const
type Target = keyof typeof targets
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
function project<S extends z.AnyZodObject>(schema: S, rows: object[]): z.infer<S>[] {
  return rows.map((row) =>
    schema.parse(
      JSON.parse(
        JSON.stringify(
          Object.fromEntries(
            Object.keys(schema.shape).map((key) => [key, (row as Record<string, unknown>)[key]])
          )
        )
      )
    )
  )
}

/** Export a consistent owner-only core snapshot through explicit field allowlists. */
export async function exportWorkspace(userId: string): Promise<CoreBackup> {
  return prisma.$transaction(
    async (db) => {
      const where = { userId }
      const [
        captures,
        goals,
        projects,
        notes,
        tasks,
        dayPlans,
        dailyReviews,
        weeklyReviews,
        focusSessions,
        growthEvidence,
        taskPlanEvents,
        taskLinks,
        projectNotes,
        noteLinks,
      ] = await Promise.all([
        db.capture.findMany({ where, orderBy: { id: 'asc' } }),
        db.goal.findMany({ where, orderBy: { id: 'asc' } }),
        db.project.findMany({ where, orderBy: { id: 'asc' } }),
        db.note.findMany({ where, orderBy: { id: 'asc' } }),
        db.task.findMany({ where, orderBy: { id: 'asc' } }),
        db.dayPlan.findMany({ where, orderBy: { id: 'asc' } }),
        db.dailyReview.findMany({ where, orderBy: { id: 'asc' } }),
        db.weeklyReview.findMany({ where, orderBy: { id: 'asc' } }),
        db.focusSession.findMany({ where, orderBy: { id: 'asc' } }),
        db.growthEvidence.findMany({ where, orderBy: { id: 'asc' } }),
        db.taskPlanEvent.findMany({ where, orderBy: { id: 'asc' } }),
        db.taskLink.findMany({ where: { task: where } }),
        db.projectNote.findMany({ where: { project: where, note: where } }),
        db.noteLink.findMany({ where: { sourceNote: where, targetNote: where } }),
      ])
      const sets = {
        tasks: new Set(tasks.map((t) => t.id)),
        notes: new Set(notes.map((t) => t.id)),
        projects: new Set(projects.map((t) => t.id)),
        goals: new Set(goals.map((t) => t.id)),
        focusSessions: new Set(focusSessions.map((t) => t.id)),
      }
      let omittedLinks = goals.filter((g) => g.expenseCategoryId).length
      const owned = (type: string | null, id: string | null) =>
        !!type && !!id && type in targets && sets[targets[type as Target]].has(id)
      const safeSource = (type: string | null, id: string | null) => {
        if (!id || owned(type, id)) return true
        omittedLinks++
        return false
      }
      const safeTask = (id: string | null) => (safeSource('task', id) ? id : null)
      const backup = {
        version: 1 as const,
        scope: 'nobrainy-core' as const,
        exportedAt: new Date().toISOString(),
        omittedLinks: 0,
        data: {
          captures: project(
            coreSchemas.captures,
            captures.map((c) =>
              safeSource(c.destinationType, c.destinationId)
                ? c
                : { ...c, destinationType: null, destinationId: null }
            )
          ),
          goals: project(coreSchemas.goals, goals),
          projects: project(coreSchemas.projects, projects),
          notes: project(coreSchemas.notes, notes),
          tasks: project(coreSchemas.tasks, tasks),
          dayPlans: project(
            coreSchemas.dayPlans,
            dayPlans.map((p) => ({
              ...p,
              focusTaskIds: p.focusTaskIds.filter((id) => safeTask(id)),
              growthTaskId: safeTask(p.growthTaskId),
              timeBlocks: (p.timeBlocks as unknown as { taskId?: string }[]).map((b) => {
                const taskId = safeTask(b.taskId ?? null)
                const { taskId: _old, ...rest } = b
                return taskId ? { ...rest, taskId } : rest
              }),
            }))
          ),
          dailyReviews: project(coreSchemas.dailyReviews, dailyReviews),
          weeklyReviews: project(coreSchemas.weeklyReviews, weeklyReviews),
          focusSessions: project(
            coreSchemas.focusSessions,
            focusSessions.map((f) => ({ ...f, nextActionId: safeTask(f.nextActionId) }))
          ),
          growthEvidence: project(
            coreSchemas.growthEvidence,
            growthEvidence.map((e) =>
              safeSource(e.sourceType, e.sourceId) ? e : { ...e, sourceType: null, sourceId: null }
            )
          ),
          taskPlanEvents: project(coreSchemas.taskPlanEvents, taskPlanEvents),
          taskLinks: project(
            coreSchemas.taskLinks,
            taskLinks.filter((l) => {
              const keep =
                ['note', 'task', 'goal', 'project'].includes(l.linkedType) &&
                owned(l.linkedType, l.linkedId)
              if (!keep) omittedLinks++
              return keep
            })
          ),
          projectNotes: project(coreSchemas.projectNotes, projectNotes),
          noteLinks: project(coreSchemas.noteLinks, noteLinks),
        },
      }
      backup.omittedLinks = omittedLinks
      return parseBackup(backup)
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 30000 }
  )
}

async function inspect(db: Prisma.TransactionClient, userId: string, backup: CoreBackup) {
  const [plans, daily, weekly] = await Promise.all([
    db.dayPlan.findMany({ where: { userId }, select: { planDate: true } }),
    db.dailyReview.findMany({ where: { userId }, select: { reviewDate: true } }),
    db.weeklyReview.findMany({ where: { userId }, select: { weekStart: true } }),
  ])
  const exists = (values: Date[]) => new Set(values.map((d) => d.toISOString().slice(0, 10)))
  const planDates = exists(plans.map((p) => p.planDate)),
    dailyDates = exists(daily.map((p) => p.reviewDate)),
    weeklyDates = exists(weekly.map((p) => p.weekStart))
  const skipped = {
    dayPlans: backup.data.dayPlans
      .map((p) => p.planDate)
      .filter((d) => planDates.has(d))
      .sort(),
    dailyReviews: backup.data.dailyReviews
      .map((p) => p.reviewDate)
      .filter((d) => dailyDates.has(d))
      .sort(),
    weeklyReviews: backup.data.weeklyReviews
      .map((p) => p.weekStart)
      .filter((d) => weeklyDates.has(d))
      .sort(),
  }
  const counts = Object.fromEntries(
    Object.entries(backup.data).map(([key, rows]) => [key, rows.length])
  ) as Record<CoreTable, number>
  const imported = {
    ...counts,
    dayPlans: counts.dayPlans - skipped.dayPlans.length,
    dailyReviews: counts.dailyReviews - skipped.dailyReviews.length,
    weeklyReviews: counts.weeklyReviews - skipped.weeklyReviews.length,
  }
  return {
    counts,
    imported,
    skipped,
    fingerprint: hash({ digest: hash(backup), skipped }),
    omittedLinks: backup.omittedLinks,
    activeSnapshots: backup.data.focusSessions.filter((f) => f.state !== 'finished').length,
  }
}
export type ImportPreview = Awaited<ReturnType<typeof inspect>>
export type ImportResult = {
  imported: Record<CoreTable, number>
  skipped: ImportPreview['skipped']
  alreadyImported: boolean
}

/** Validate and preview the exact additive import without changing any record. */
export async function previewImport(userId: string, input: unknown): Promise<ImportPreview> {
  const backup = parseBackup(input)
  return prisma.$transaction((db) => inspect(db, userId, backup), {
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
  })
}
const day = (value: string | null) => (value ? new Date(`${value}T00:00:00Z`) : null)

/** Import all accepted core rows and an idempotent receipt in one owner-serialized transaction. */
export async function importWorkspace(
  userId: string,
  input: unknown,
  clientRequestId: string,
  fingerprint: string
): Promise<ImportResult> {
  z.string().uuid().parse(clientRequestId)
  const backup = parseBackup(input),
    digest = hash(backup)
  return prisma.$transaction(
    async (db) => {
      await db.user.update({ where: { id: userId }, data: { lastActiveAt: new Date() } })
      const byRequest = await db.coreImportReceipt.findUnique({
        where: { userId_clientRequestId: { userId, clientRequestId } },
      })
      if (byRequest && byRequest.digest !== digest)
        throw Error('This import request belongs to another backup.')
      const existing =
        byRequest ??
        (await db.coreImportReceipt.findUnique({ where: { userId_digest: { userId, digest } } }))
      if (existing)
        return { ...(existing.result as unknown as ImportResult), alreadyImported: true }
      const preview = await inspect(db, userId, backup)
      if (preview.fingerprint !== fingerprint)
        throw Error('The import preview changed. Preview this backup again.')
      const { data } = backup
      const maps = Object.fromEntries(
        Object.entries(data).map(([table, rows]) => [
          table,
          new Map(rows.flatMap((row) => ('id' in row ? [[row.id, randomUUID()]] : []))),
        ])
      ) as Record<CoreTable, Map<string, string>>
      const remap = (table: CoreTable, id: string | null) => (id ? maps[table].get(id)! : null)
      const own = (table: CoreTable, id: string) => ({ id: remap(table, id)!, userId })
      const practice = (key: string | null) => {
        if (!key) return null
        const [type, id, ...rest] = key.split(':')
        const table =
          type === 'routine' || type === 'task'
            ? 'tasks'
            : type === 'session'
              ? 'focusSessions'
              : type === 'evidence'
                ? 'growthEvidence'
                : null
        return table && maps[table].has(id)
          ? [type, maps[table].get(id), ...rest].join(':')
          : `import:${digest}:${key}`
      }
      for (const g of data.goals)
        await db.goal.create({
          data: {
            ...g,
            ...own('goals', g.id),
            targetDate: day(g.targetDate),
            startDate: day(g.startDate),
          },
        })
      for (const n of data.notes)
        await db.note.create({
          data: { ...n, ...own('notes', n.id), isPublic: false, shareId: null },
        })
      for (const p of data.projects)
        await db.project.create({
          data: {
            ...p,
            ...own('projects', p.id),
            goalId: remap('goals', p.goalId),
            nextActionId: null,
          },
        })
      for (const t of data.tasks)
        await db.task.create({
          data: {
            ...t,
            ...own('tasks', t.id),
            goalId: remap('goals', t.goalId),
            projectId: remap('projects', t.projectId),
            parentTaskId: null,
            routineId: null,
            plannedDate: day(t.plannedDate),
            dueDate: day(t.dueDate),
            occurrenceDate: day(t.occurrenceDate),
            recurrenceAnchor: day(t.recurrenceAnchor),
          },
        })
      for (const t of data.tasks)
        await db.task.update({
          where: { id: remap('tasks', t.id)! },
          data: {
            parentTaskId: remap('tasks', t.parentTaskId),
            routineId: remap('tasks', t.routineId),
            updatedAt: t.updatedAt,
          },
        })
      for (const p of data.projects)
        if (p.nextActionId)
          await db.project.update({
            where: { id: remap('projects', p.id)! },
            data: { nextActionId: remap('tasks', p.nextActionId), updatedAt: p.updatedAt },
          })
      for (const l of data.taskLinks)
        await db.taskLink.create({
          data: {
            taskId: remap('tasks', l.taskId)!,
            linkedType: l.linkedType,
            linkedId: remap(targets[l.linkedType], l.linkedId)!,
          },
        })
      for (const l of data.projectNotes)
        await db.projectNote.create({
          data: { projectId: remap('projects', l.projectId)!, noteId: remap('notes', l.noteId)! },
        })
      for (const l of data.noteLinks)
        await db.noteLink.create({
          data: {
            ...l,
            id: remap('noteLinks', l.id)!,
            sourceId: remap('notes', l.sourceId)!,
            targetId: remap('notes', l.targetId)!,
          },
        })
      for (const c of data.captures)
        await db.capture.create({
          data: {
            ...c,
            ...own('captures', c.id),
            clientRequestId: randomUUID(),
            destinationId: c.destinationType
              ? remap(targets[c.destinationType as Target], c.destinationId)
              : null,
          },
        })
      for (const e of data.taskPlanEvents)
        await db.taskPlanEvent.create({
          data: {
            ...e,
            ...own('taskPlanEvents', e.id),
            taskId: remap('tasks', e.taskId),
            fromDate: day(e.fromDate),
            toDate: day(e.toDate),
          },
        })
      for (const p of data.dayPlans)
        if (!preview.skipped.dayPlans.includes(p.planDate))
          await db.dayPlan.create({
            data: {
              ...p,
              ...own('dayPlans', p.id),
              planDate: day(p.planDate)!,
              focusTaskIds: p.focusTaskIds.map((id) => remap('tasks', id)!),
              growthTaskId: remap('tasks', p.growthTaskId),
              timeBlocks: p.timeBlocks.map((b) => ({
                ...b,
                id: randomUUID(),
                ...(b.taskId && { taskId: remap('tasks', b.taskId)! }),
              })),
            },
          })
      for (const r of data.dailyReviews)
        if (!preview.skipped.dailyReviews.includes(r.reviewDate))
          await db.dailyReview.create({
            data: {
              ...r,
              ...own('dailyReviews', r.id),
              reviewDate: day(r.reviewDate)!,
              tomorrowTaskId: remap('tasks', r.tomorrowTaskId),
            },
          })
      for (const r of data.weeklyReviews)
        if (!preview.skipped.weeklyReviews.includes(r.weekStart))
          await db.weeklyReview.create({
            data: {
              ...r,
              ...own('weeklyReviews', r.id),
              weekStart: day(r.weekStart)!,
              nextTaskId: remap('tasks', r.nextTaskId),
            },
          })
      for (const f of data.focusSessions) {
        const active = f.state !== 'finished'
        const elapsed =
          f.accumulatedSeconds +
          (f.state === 'running' && f.activeSince
            ? Math.max(
                0,
                Math.floor((Date.parse(backup.exportedAt) - Date.parse(f.activeSince)) / 1000)
              )
            : 0)
        await db.focusSession.create({
          data: {
            ...f,
            ...own('focusSessions', f.id),
            clientRequestId: randomUUID(),
            taskId: remap('tasks', f.taskId),
            nextActionId: remap('tasks', f.nextActionId),
            state: 'finished',
            activeOwner: null,
            activeSince: null,
            accumulatedSeconds: Math.min(f.plannedSeconds, elapsed),
            completedAt: active ? backup.exportedAt : f.completedAt,
            outcome: active ? 'progress' : f.outcome,
          },
        })
      }
      for (const e of data.growthEvidence)
        await db.growthEvidence.create({
          data: {
            ...e,
            ...own('growthEvidence', e.id),
            clientRequestId: randomUUID(),
            goalId: remap('goals', e.goalId)!,
            observedAt: day(e.observedAt)!,
            sourceId: e.sourceType ? remap(targets[e.sourceType], e.sourceId) : null,
            practiceKey: practice(e.practiceKey),
          },
        })
      const result: ImportResult = {
        imported: preview.imported,
        skipped: preview.skipped,
        alreadyImported: false,
      }
      await db.coreImportReceipt.create({
        data: {
          userId,
          clientRequestId,
          digest,
          result: result as unknown as Prisma.InputJsonValue,
        },
      })
      return result
    },
    { timeout: 60000 }
  )
}
