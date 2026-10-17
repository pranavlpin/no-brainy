import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { addActionSchema } from '@/lib/validations/projects'
import {
  actionTaskId,
  projectError,
  projectFailure,
  projectInclude,
  serializeProject,
} from '@/lib/projects/server'

/** Create a task in the project and make it the next action; a retry reuses the task. */
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const projectId = req.nextUrl.pathname.split('/').at(-2)!
    const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } })
    if (!project) return projectError('NOT_FOUND', 'Project not found', 404)
    const { title, submissionId } = addActionSchema.parse(await req.json())
    const id = actionTaskId(user.id, projectId, submissionId)
    const result = await prisma.$transaction(async (db) => {
      const task = await db.task.upsert({
        where: { id },
        update: {},
        create: {
          id,
          userId: user.id,
          projectId,
          title,
          context: project.context,
          goalId: project.goalId,
        },
      })
      await db.project.update({ where: { id: projectId }, data: { nextActionId: task.id } })
      return db.project.findUniqueOrThrow({
        where: { id: projectId },
        include: projectInclude(user.id),
      })
    })
    return NextResponse.json({ success: true, data: serializeProject(result) }, { status: 201 })
  } catch (error) {
    return projectFailure(error)
  }
})
