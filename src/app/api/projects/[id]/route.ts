import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { updateProjectSchema } from '@/lib/validations/projects'
import {
  projectError,
  projectFailure,
  projectInclude,
  serializeProject,
  validProjectRelations,
} from '@/lib/projects/server'

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const id = req.nextUrl.pathname.split('/').pop()!
    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
      include: projectInclude(user.id),
    })
    return project
      ? NextResponse.json({ success: true, data: serializeProject(project) })
      : projectError('NOT_FOUND', 'Project not found', 404)
  } catch (error) {
    return projectFailure(error)
  }
})

export const PATCH = withAuth(async (req: NextRequest, user) => {
  try {
    const id = req.nextUrl.pathname.split('/').pop()!
    const existing = await prisma.project.findFirst({ where: { id, userId: user.id } })
    if (!existing) return projectError('NOT_FOUND', 'Project not found', 404)
    const { noteIds, expectedUpdatedAt, ...data } = updateProjectSchema.parse(await req.json())
    if (!(await validProjectRelations(prisma, user.id, { ...data, noteIds }, id))) {
      return projectError(
        'INVALID_RELATION',
        'Choose a goal, a note, and an open task of this project from your own workspace',
        400
      )
    }
    const project = await prisma.$transaction(async (db) => {
      const changed = await db.project.updateMany({
        where: {
          id,
          userId: user.id,
          ...(expectedUpdatedAt && { updatedAt: new Date(expectedUpdatedAt) }),
        },
        data: {
          ...data,
          updatedAt: new Date(Math.max(Date.now(), existing.updatedAt.getTime() + 1)),
        },
      })
      if (!changed.count) return null
      if (noteIds) {
        await db.projectNote.deleteMany({ where: { projectId: id } })
        if (noteIds.length) {
          await db.projectNote.createMany({
            data: [...new Set(noteIds)].map((noteId) => ({ projectId: id, noteId })),
          })
        }
      }
      return db.project.findUniqueOrThrow({ where: { id }, include: projectInclude(user.id) })
    })
    return project
      ? NextResponse.json({ success: true, data: serializeProject(project) })
      : projectError('CONFLICT', 'This project changed elsewhere. Reload before saving.', 409)
  } catch (error) {
    return projectFailure(error)
  }
})

/** Archive, never delete: tasks, notes, and history stay. */
export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const id = req.nextUrl.pathname.split('/').pop()!
    const changed = await prisma.project.updateMany({
      where: { id, userId: user.id },
      data: { status: 'archived' },
    })
    return changed.count
      ? NextResponse.json({ success: true, data: { id } })
      : projectError('NOT_FOUND', 'Project not found', 404)
  } catch (error) {
    return projectFailure(error)
  }
})
