import { createHash } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { formatTask } from '@/lib/tasks/format'
import type { ProjectResponse } from '@/lib/types/projects'

/** Every project read constrains related rows to the authenticated owner. */
export function projectInclude(userId: string) {
  return {
    tasks: { where: { userId }, orderBy: [{ status: 'asc' as const }, { createdAt: 'asc' as const }] },
    notes: {
      where: { note: { userId, isDeleted: false } },
      include: { note: { select: { id: true, title: true, updatedAt: true } } },
    },
    nextAction: true,
  } satisfies Prisma.ProjectInclude
}

type ProjectRow = Prisma.ProjectGetPayload<{ include: ReturnType<typeof projectInclude> }>

const OPEN = new Set(['pending', 'in_progress'])

/** API shape with full task metadata; a finished next action reads as none chosen. */
export function serializeProject(project: ProjectRow): ProjectResponse {
  const next = project.nextAction && OPEN.has(project.nextAction.status) ? project.nextAction : null
  return {
    id: project.id,
    userId: project.userId,
    title: project.title,
    outcome: project.outcome,
    context: project.context as ProjectResponse['context'],
    status: project.status as ProjectResponse['status'],
    goalId: project.goalId,
    nextActionId: next?.id ?? null,
    nextAction: next ? formatTask(next) : null,
    tasks: project.tasks.map(formatTask),
    notes: project.notes.map((link) => ({
      id: link.note.id,
      title: link.note.title,
      updatedAt: link.note.updatedAt.toISOString(),
    })),
    taskCount: project.tasks.length,
    completedTaskCount: project.tasks.filter((t) => t.status === 'completed').length,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }
}

/** Reject missing or foreign goal, next action, and note relations before any write. */
export async function validProjectRelations(
  db: Prisma.TransactionClient,
  userId: string,
  data: { goalId?: string | null; nextActionId?: string | null; noteIds?: string[] },
  projectId?: string
): Promise<boolean> {
  if (data.goalId) {
    const goal = await db.goal.findFirst({ where: { id: data.goalId, userId }, select: { id: true } })
    if (!goal) return false
  }
  if (data.nextActionId) {
    const task = await db.task.findFirst({
      where: { id: data.nextActionId, userId, projectId, status: { in: [...OPEN] } },
      select: { id: true },
    })
    if (!task) return false
  }
  if (data.noteIds) {
    const ids = [...new Set(data.noteIds)]
    const owned = await db.note.count({ where: { id: { in: ids }, userId, isDeleted: false } })
    if (owned !== ids.length) return false
  }
  return true
}

/** Deterministic task id for an add-action submission so a retry is a no-op. */
export function actionTaskId(userId: string, projectId: string, submissionId: string): string {
  return `pa${createHash('sha256').update(JSON.stringify([userId, projectId, submissionId])).digest('hex').slice(0, 24)}`
}

export function projectError(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

export function projectFailure(error: unknown) {
  if (error instanceof ZodError) {
    return projectError('VALIDATION_ERROR', error.issues[0]?.message ?? 'Check your entries', 400)
  }
  console.error('[projects]', error)
  return projectError('INTERNAL_ERROR', 'Could not save this change. Try again.', 500)
}
