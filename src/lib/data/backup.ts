/**
 * Core backup: export, preview, and additive import with id remapping.
 *
 * Ported from the owner's acceptance branch (`test/product-final-acceptance`,
 * NB-13) and adapted to this branch's models. Import never replaces or
 * deletes; every imported row gets a fresh id and a receipt makes retries
 * safe.
 */
import { createHash, randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import type { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { dateFromKey } from '@/lib/dates'
import { priorityRank } from '@/lib/tasks/priority'
import {
  coreSchemas,
  LINK_TARGETS,
  parseBackup,
  type CoreBackup,
  type CoreTable,
} from '@/lib/validations/backup'

const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')

/** Project database rows onto a strict schema; unknown fields never leave the server. */
function pick<S extends z.AnyZodObject>(schema: S, rows: object[]): z.infer<S>[] {
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

const key = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null)

/** Export the owner's core workspace through explicit allowlists. */
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
        db.taskLink.findMany({ where: { task: where } }),
        db.projectNote.findMany({ where: { project: where, note: where } }),
        db.noteLink.findMany({ where: { sourceNote: where, targetNote: where } }),
      ])
      const owned = {
        tasks: new Set(tasks.map((t) => t.id)),
        notes: new Set(notes.map((n) => n.id)),
        projects: new Set(projects.map((p) => p.id)),
        goals: new Set(goals.map((g) => g.id)),
        focusSessions: new Set(focusSessions.map((f) => f.id)),
      }
      let omittedLinks = goals.filter((g) => g.expenseCategoryId).length
      const has = (type: string | null, id: string | null) =>
        !!type && !!id && type in LINK_TARGETS && owned[LINK_TARGETS[type as keyof typeof LINK_TARGETS]].has(id)
      const keep = (type: string | null, id: string | null) => {
        if (!id) return true
        if (has(type, id)) return true
        omittedLinks++
        return false
      }
      const safeTask = (id: string | null) => (keep('task', id) ? id : null)

      const backup: CoreBackup = {
        version: 1,
        scope: 'nobrainy-core',
        exportedAt: new Date().toISOString(),
        omittedLinks: 0,
        data: {
          captures: pick(
            coreSchemas.captures,
            captures.map((c) =>
              c.destinationType !== 'bookmark' && keep(c.destinationType, c.destinationId)
                ? c
                : { ...c, destinationType: null, destinationId: null }
            )
          ),
          goals: pick(
            coreSchemas.goals,
            goals.map((g) => ({
              ...g,
              targetDate: key(g.targetDate),
              startDate: key(g.startDate),
              targetAmount: g.targetAmount ? g.targetAmount.toFixed(2) : null,
            }))
          ),
          projects: pick(coreSchemas.projects, projects),
          notes: pick(coreSchemas.notes, notes),
          tasks: pick(
            coreSchemas.tasks,
            tasks.map((t) => ({ ...t, plannedDate: key(t.plannedDate), dueDate: key(t.dueDate) }))
          ),
          taskLinks: pick(
            coreSchemas.taskLinks,
            taskLinks.filter((l) => {
              const ok = l.linkedType in LINK_TARGETS && l.linkedType !== 'session' && has(l.linkedType, l.linkedId)
              if (!ok) omittedLinks++
              return ok
            })
          ),
          projectNotes: pick(coreSchemas.projectNotes, projectNotes),
          noteLinks: pick(coreSchemas.noteLinks, noteLinks.filter((l) => l.targetType === 'note')),
          dayPlans: pick(
            coreSchemas.dayPlans,
            dayPlans.map((p) => ({
              ...p,
              planDate: key(p.planDate),
              focusTaskIds: p.focusTaskIds.filter((id) => safeTask(id)),
              timeBlocks: ((p.timeBlocks as unknown as { taskId?: string }[]) ?? []).map((b) => {
                const { taskId, ...rest } = b
                const kept = taskId ? safeTask(taskId) : null
                return kept ? { ...rest, taskId: kept } : rest
              }),
            }))
          ),
          dailyReviews: pick(
            coreSchemas.dailyReviews,
            dailyReviews.map((r) => ({ ...r, reviewDate: key(r.reviewDate) }))
          ),
          weeklyReviews: pick(
            coreSchemas.weeklyReviews,
            weeklyReviews.map((r) => ({ ...r, weekStart: key(r.weekStart), nextTaskId: safeTask(r.nextTaskId) }))
          ),
          focusSessions: pick(
            coreSchemas.focusSessions,
            focusSessions.map((f) => ({ ...f, nextActionTaskId: safeTask(f.nextActionTaskId) }))
          ),
          growthEvidence: pick(
            coreSchemas.growthEvidence,
            growthEvidence.map((e) => ({
              ...e,
              observedAt: key(e.observedAt),
              ...(e.sourceType === 'book' || !keep(e.sourceType, e.sourceId)
                ? { sourceType: null, sourceId: null }
                : {}),
            }))
          ),
        },
      }
      backup.omittedLinks = omittedLinks
      return parseBackup(backup)
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 30000 }
  )
}

/** Give every row a fresh id and rewrite every reference to match. Pure. */
export function remapBackup(backup: CoreBackup, makeId: () => string = randomUUID): CoreBackup {
  const { data } = backup
  const maps = {} as Record<CoreTable, Map<string, string>>
  for (const [table, rows] of Object.entries(data) as [CoreTable, { id?: string }[]][]) {
    maps[table] = new Map(rows.flatMap((r) => (r.id ? [[r.id, makeId()] as const] : [])))
  }
  const to = (table: CoreTable, id: string | null | undefined): string | null =>
    id ? (maps[table].get(id) ?? null) : null
  const must = (table: CoreTable, id: string) => maps[table].get(id)!
  const target = (type: keyof typeof LINK_TARGETS, id: string | null) => to(LINK_TARGETS[type], id)
  return {
    ...backup,
    data: {
      captures: data.captures.map((c) => ({
        ...c,
        id: must('captures', c.id),
        destinationId: c.destinationType && c.destinationType !== 'bookmark' ? target(c.destinationType, c.destinationId) : null,
        destinationType: c.destinationType === 'bookmark' ? null : c.destinationType,
      })),
      goals: data.goals.map((g) => ({ ...g, id: must('goals', g.id) })),
      projects: data.projects.map((p) => ({
        ...p,
        id: must('projects', p.id),
        goalId: to('goals', p.goalId),
        nextActionId: to('tasks', p.nextActionId),
      })),
      notes: data.notes.map((n) => ({ ...n, id: must('notes', n.id) })),
      tasks: data.tasks.map((t) => ({
        ...t,
        id: must('tasks', t.id),
        parentTaskId: to('tasks', t.parentTaskId),
        projectId: to('projects', t.projectId),
        goalId: to('goals', t.goalId),
      })),
      taskLinks: data.taskLinks.map((l) => ({
        taskId: must('tasks', l.taskId),
        linkedType: l.linkedType,
        linkedId: target(l.linkedType, l.linkedId)!,
      })),
      projectNotes: data.projectNotes.map((l) => ({
        projectId: must('projects', l.projectId),
        noteId: must('notes', l.noteId),
      })),
      noteLinks: data.noteLinks.map((l) => ({
        ...l,
        id: must('noteLinks', l.id),
        sourceId: must('notes', l.sourceId),
        targetId: must('notes', l.targetId),
      })),
      dayPlans: data.dayPlans.map((p) => ({
        ...p,
        id: must('dayPlans', p.id),
        focusTaskIds: p.focusTaskIds.map((id) => must('tasks', id)),
        timeBlocks: p.timeBlocks.map((b) => ({
          ...b,
          id: makeId(),
          ...(b.taskId ? { taskId: must('tasks', b.taskId) } : {}),
        })),
      })),
      dailyReviews: data.dailyReviews.map((r) => ({ ...r, id: must('dailyReviews', r.id) })),
      weeklyReviews: data.weeklyReviews.map((r) => ({
        ...r,
        id: must('weeklyReviews', r.id),
        nextTaskId: to('tasks', r.nextTaskId),
      })),
      focusSessions: data.focusSessions.map((f) => ({
        ...f,
        id: must('focusSessions', f.id),
        taskId: to('tasks', f.taskId),
        nextActionTaskId: to('tasks', f.nextActionTaskId),
      })),
      growthEvidence: data.growthEvidence.map((e) => ({
        ...e,
        id: must('growthEvidence', e.id),
        goalId: must('goals', e.goalId),
        sourceId: e.sourceType ? target(e.sourceType, e.sourceId) : null,
      })),
    },
  }
}

async function inspect(db: Prisma.TransactionClient, userId: string, backup: CoreBackup) {
  const [plans, daily, weekly] = await Promise.all([
    db.dayPlan.findMany({ where: { userId }, select: { planDate: true } }),
    db.dailyReview.findMany({ where: { userId }, select: { reviewDate: true } }),
    db.weeklyReview.findMany({ where: { userId }, select: { weekStart: true } }),
  ])
  const keys = (values: Date[]) => new Set(values.map((d) => d.toISOString().slice(0, 10)))
  const planDates = keys(plans.map((p) => p.planDate))
  const dailyDates = keys(daily.map((r) => r.reviewDate))
  const weeklyDates = keys(weekly.map((r) => r.weekStart))
  const skipped = {
    dayPlans: backup.data.dayPlans.map((p) => p.planDate).filter((d) => planDates.has(d)).sort(),
    dailyReviews: backup.data.dailyReviews.map((r) => r.reviewDate).filter((d) => dailyDates.has(d)).sort(),
    weeklyReviews: backup.data.weeklyReviews.map((r) => r.weekStart).filter((d) => weeklyDates.has(d)).sort(),
  }
  const counts = Object.fromEntries(
    Object.entries(backup.data).map(([table, rows]) => [table, rows.length])
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
    openSessions: backup.data.focusSessions.filter((f) => !f.endedAt).length,
  }
}

export type ImportPreview = Awaited<ReturnType<typeof inspect>>
export interface ImportResult {
  imported: Record<CoreTable, number>
  skipped: ImportPreview['skipped']
  alreadyImported: boolean
}

/** Validate and describe the exact additive import without writing. */
export async function previewImport(userId: string, input: unknown): Promise<ImportPreview> {
  const backup = parseBackup(input)
  return prisma.$transaction((db) => inspect(db, userId, backup))
}

const day = (value: string | null) => (value ? dateFromKey(value) : null)

/** Import every accepted row with fresh ids and record a receipt, in one transaction. */
export async function importWorkspace(
  userId: string,
  input: unknown,
  clientRequestId: string,
  fingerprint: string
): Promise<ImportResult> {
  const original = parseBackup(input)
  const digest = hash(original)
  return prisma.$transaction(
    async (db) => {
      const byRequest = await db.coreImportReceipt.findUnique({
        where: { userId_clientRequestId: { userId, clientRequestId } },
      })
      if (byRequest && byRequest.digest !== digest) {
        throw new Error('This import request belongs to a different backup file.')
      }
      const existing =
        byRequest ?? (await db.coreImportReceipt.findUnique({ where: { userId_digest: { userId, digest } } }))
      if (existing) return { ...(existing.result as unknown as ImportResult), alreadyImported: true }

      const preview = await inspect(db, userId, original)
      if (preview.fingerprint !== fingerprint) {
        throw new Error('The import preview is out of date. Preview this backup again.')
      }
      const { data } = remapBackup(original)
      const exportedAt = new Date(original.exportedAt)

      for (const g of data.goals) {
        await db.goal.create({
          data: { ...g, userId, targetDate: day(g.targetDate), startDate: day(g.startDate) },
        })
      }
      for (const n of data.notes) {
        await db.note.create({ data: { ...n, userId, isPublic: false, shareId: null } })
      }
      for (const p of data.projects) {
        await db.project.create({ data: { ...p, userId, nextActionId: null } })
      }
      for (const t of data.tasks) {
        await db.task.create({
          data: {
            ...t,
            userId,
            parentTaskId: null,
            priorityRank: priorityRank(t.priority),
            plannedDate: day(t.plannedDate),
            dueDate: day(t.dueDate),
          },
        })
      }
      for (const t of data.tasks) {
        if (t.parentTaskId) {
          await db.task.update({ where: { id: t.id }, data: { parentTaskId: t.parentTaskId, updatedAt: t.updatedAt } })
        }
      }
      for (const p of data.projects) {
        if (p.nextActionId) {
          await db.project.update({ where: { id: p.id }, data: { nextActionId: p.nextActionId, updatedAt: p.updatedAt } })
        }
      }
      for (const l of data.taskLinks) await db.taskLink.create({ data: l })
      for (const l of data.projectNotes) await db.projectNote.create({ data: l })
      for (const l of data.noteLinks) await db.noteLink.create({ data: l })
      for (const c of data.captures) {
        await db.capture.create({ data: { ...c, userId, clientRequestId: randomUUID() } })
      }
      for (const p of data.dayPlans) {
        if (preview.skipped.dayPlans.includes(p.planDate)) continue
        await db.dayPlan.create({
          data: {
            ...p,
            userId,
            planDate: day(p.planDate)!,
            timeBlocks: p.timeBlocks as unknown as Prisma.InputJsonValue,
          },
        })
      }
      for (const r of data.dailyReviews) {
        if (preview.skipped.dailyReviews.includes(r.reviewDate)) continue
        await db.dailyReview.create({ data: { ...r, userId, reviewDate: day(r.reviewDate)! } })
      }
      for (const r of data.weeklyReviews) {
        if (preview.skipped.weeklyReviews.includes(r.weekStart)) continue
        await db.weeklyReview.create({
          data: { ...r, userId, weekStart: day(r.weekStart)!, outcomes: r.outcomes as unknown as Prisma.InputJsonValue },
        })
      }
      for (const f of data.focusSessions) {
        // An open session in a backup cannot keep running here; it closes at export time.
        const endedAt = f.endedAt ? new Date(f.endedAt) : exportedAt
        const durationSec = f.endedAt
          ? f.durationSec
          : Math.max(0, Math.round((exportedAt.getTime() - new Date(f.startedAt).getTime()) / 1000))
        await db.focusSession.create({ data: { ...f, userId, endedAt, durationSec } })
      }
      for (const e of data.growthEvidence) {
        await db.growthEvidence.create({
          data: { ...e, userId, clientRequestId: randomUUID(), observedAt: day(e.observedAt)! },
        })
      }

      const result: ImportResult = { imported: preview.imported, skipped: preview.skipped, alreadyImported: false }
      await db.coreImportReceipt.create({
        data: { userId, clientRequestId, digest, result: result as unknown as Prisma.InputJsonValue },
      })
      return result
    },
    { timeout: 60000 }
  )
}
