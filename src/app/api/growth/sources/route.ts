import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { growthSourceQuerySchema } from '@/lib/validations/growth'
import { todayInTimezone } from '@/lib/dates/calendar'
import { growthFailure } from '@/lib/growth/server'
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const input = growthSourceQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    const take = 21
    const skip = (input.page - 1) * 20
    const title = { contains: input.search, mode: 'insensitive' as const }
    let items: { id: string; title: string; observedAt?: string }[] = []
    if (input.type === 'note')
      items = await prisma.note.findMany({
        where: { userId: user.id, isDeleted: false, title },
        select: { id: true, title: true },
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        skip,
        take,
      })
    if (input.type === 'book')
      items = await prisma.book.findMany({
        where: { userId: user.id, title },
        select: { id: true, title: true },
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        skip,
        take,
      })
    if (input.type === 'project')
      items = await prisma.project.findMany({
        where: { userId: user.id, title },
        select: { id: true, title: true },
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        skip,
        take,
      })
    if (input.type === 'session')
      items = (
        await prisma.focusSession.findMany({
          where: { userId: user.id, state: 'finished', taskTitle: title },
          select: { id: true, taskTitle: true, completedAt: true },
          orderBy: [{ completedAt: 'desc' }, { id: 'asc' }],
          skip,
          take,
        })
      ).map((item) => ({
        id: item.id,
        title: `${item.taskTitle} · ${todayInTimezone(user.timezone, item.completedAt!)}`,
        observedAt: todayInTimezone(user.timezone, item.completedAt!),
      }))
    return NextResponse.json({
      success: true,
      data: { items: items.slice(0, 20), hasMore: items.length > 20, page: input.page },
    })
  } catch (error) {
    return growthFailure(error)
  }
})
