import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import {
  projectError,
  projectFailure,
  projectInclude,
  serializeProject,
} from '@/lib/projects/server'

const input = z.object({
  title: z.string().trim().min(1).max(500),
  submissionId: z.string().uuid(),
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const projectId = req.nextUrl.pathname.split('/').at(-2)!
    const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } })
    if (!project) return projectError('NOT_FOUND', 'Project not found', 404)
    const { title, submissionId } = input.parse(await req.json())
    const taskId = `pa${createHash('sha256')
      .update(JSON.stringify([user.id, projectId, submissionId]))
      .digest('hex')}`
    const result = await prisma.$transaction(async (db) => {
      const task = await db.task.upsert({
        where: { id: taskId },
        update: {},
        create: {
          id: taskId,
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
