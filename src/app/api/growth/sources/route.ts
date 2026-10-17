import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { dateKeyFromDate, userTimezone } from '@/lib/dates'
import { growthSourceQuerySchema } from '@/lib/validations/growth'
import { growthFailure } from '@/lib/growth/server'
import type { GrowthSourceItem } from '@/lib/types/growth'

const PAGE = 20

/** Owned things evidence can cite: notes, books, projects, finished sessions. */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const q = growthSourceQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    const skip = (q.page - 1) * PAGE
    const take = PAGE + 1
    const title = { contains: q.search, mode: 'insensitive' as const }
    let items: GrowthSourceItem[] = []
    if (q.type === 'note') {
      items = await prisma.note.findMany({
        where: { userId: user.id, isDeleted: false, title },
        select: { id: true, title: true },
        orderBy: [{ updatedAt: 'desc' }],
        skip,
        take,
      })
    } else if (q.type === 'book') {
      items = await prisma.book.findMany({
        where: { userId: user.id, title },
        select: { id: true, title: true },
        orderBy: [{ updatedAt: 'desc' }],
        skip,
        take,
      })
    } else if (q.type === 'project') {
      items = await prisma.project.findMany({
        where: { userId: user.id, title },
        select: { id: true, title: true },
        orderBy: [{ updatedAt: 'desc' }],
        skip,
        take,
      })
    } else {
      const tz = userTimezone(user)
      const sessions = await prisma.focusSession.findMany({
        where: {
          userId: user.id,
          outcome: { not: null },
          ...(q.search && {
            OR: [{ intention: title }, { task: { title } }],
          }),
        },
        select: { id: true, intention: true, endedAt: true, task: { select: { title: true } } },
        orderBy: [{ endedAt: 'desc' }],
        skip,
        take,
      })
      items = sessions.map((s) => {
        const day = s.endedAt ? dateKeyFromDate(s.endedAt, tz) : undefined
        return {
          id: s.id,
          title: `${s.task?.title ?? s.intention ?? 'Focus block'}${day ? ` · ${day}` : ''}`,
          observedAt: day,
        }
      })
    }
    return NextResponse.json({
      success: true,
      data: { items: items.slice(0, PAGE), hasMore: items.length > PAGE, page: q.page },
    })
  } catch (error) {
    return growthFailure(error)
  }
})
