import type { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { serializeTask } from '@/lib/tasks/serialize'

/** All project read paths constrain related records to the authenticated owner. */
export function projectInclude(userId: string) {
  return {
    tasks: { where: { userId }, orderBy: { createdAt: 'asc' as const } },
    notes: { where: { note: { userId, isDeleted: false } }, include: { note: true } },
    nextAction: true,
  } satisfies Prisma.ProjectInclude
}

/** Project API representation with full task metadata and directly usable note links. */
export function serializeProject(
  project: Prisma.ProjectGetPayload<{ include: ReturnType<typeof projectInclude> }>
) {
  return {
    ...project,
    tasks: project.tasks.map(serializeTask),
    notes: project.notes.map((link) => link.note),
    taskCount: project.tasks.length,
    completedTaskCount: project.tasks.filter((task) => task.status === 'completed').length,
    nextAction: project.nextAction ? serializeTask(project.nextAction) : null,
  }
}

/** Reject missing/foreign goal, action and note relations before writing any project change. */
export async function validProjectRelations(
  db: Prisma.TransactionClient,
  userId: string,
  data: { goalId?: string | null; nextActionId?: string | null; noteIds?: string[] },
  projectId?: string
) {
  if (
    data.goalId &&
    !(await db.goal.findFirst({ where: { id: data.goalId, userId }, select: { id: true } }))
  )
    return false
  if (
    data.nextActionId &&
    !(await db.task.findFirst({
      where: {
        id: data.nextActionId,
        userId,
        projectId,
        status: { in: ['pending', 'in_progress'] },
      },
      select: { id: true },
    }))
  )
    return false
  if (data.noteIds) {
    const ids = [...new Set(data.noteIds)]
    if (
      (await db.note.count({ where: { id: { in: ids }, userId, isDeleted: false } })) !== ids.length
    )
      return false
  }
  return true
}

/** Consistent API failure without exposing database details or private content. */
export function projectFailure(error: unknown) {
  if (error instanceof ZodError)
    return projectError('VALIDATION_ERROR', error.issues[0]?.message ?? 'Check your entries', 400)
  return projectError('INTERNAL_ERROR', 'Could not save this change. Please try again.', 500)
}
/** Build a typed API error envelope. */
export function projectError(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}
