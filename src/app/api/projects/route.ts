import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { projectSchema, projectQuerySchema } from '@/lib/validations/projects'
import {
  projectInclude,
  serializeProject,
  validProjectRelations,
  projectError,
  projectFailure,
} from '@/lib/projects/server'

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const query = projectQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    const projects = await prisma.project.findMany({
      where: {
        userId: user.id,
        ...(query.status !== 'all' && { status: query.status }),
        ...(query.context && query.context !== 'all' && { context: query.context }),
        ...(query.search && { title: { contains: query.search, mode: 'insensitive' } }),
      },
      include: projectInclude(user.id),
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
    })
    return NextResponse.json({ success: true, data: projects.map(serializeProject) })
  } catch (error) {
    return projectFailure(error)
  }
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const data = projectSchema.parse(await req.json())
    if (!(await validProjectRelations(prisma, user.id, data)))
      return projectError('INVALID_RELATION', 'Choose a goal from your own workspace', 400)
    const project = await prisma.project.create({
      data: { ...data, userId: user.id },
      include: projectInclude(user.id),
    })
    return NextResponse.json({ success: true, data: serializeProject(project) }, { status: 201 })
  } catch (error) {
    return projectFailure(error)
  }
})
