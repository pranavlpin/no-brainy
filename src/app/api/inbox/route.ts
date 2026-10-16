import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { captureQuerySchema, captureSchema, captureSource } from '@/lib/validations/inbox'
import { inboxError, inboxFailure } from '@/lib/inbox/server'

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const query = captureQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    const where = {
      userId: user.id,
      ...(query.id && { id: query.id }),
      ...(query.state !== 'all' && { state: query.state }),
      ...(query.search && { content: { contains: query.search, mode: 'insensitive' as const } }),
    }
    const [items, total] = await Promise.all([
      prisma.capture.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.capture.count({ where }),
    ])
    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page: query.page,
        pageSize: query.pageSize,
        hasMore: query.page * query.pageSize < total,
      },
    })
  } catch (error) {
    return inboxFailure(error)
  }
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const input = captureSchema.parse(await req.json())
    const capture = await prisma.capture.upsert({
      where: {
        userId_clientRequestId: { userId: user.id, clientRequestId: input.clientRequestId },
      },
      update: {},
      create: {
        ...input,
        sourceUrl: input.sourceUrl ?? captureSource(input.content),
        userId: user.id,
      },
    })
    if (capture.content !== input.content)
      return inboxError(
        'CONFLICT',
        'The earlier version was already captured. Keep this text as a new capture to save your changes.',
        409
      )
    return NextResponse.json({ success: true, data: capture }, { status: 201 })
  } catch (error) {
    return inboxFailure(error)
  }
})
