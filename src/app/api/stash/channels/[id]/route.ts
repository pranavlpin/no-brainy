import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth/middleware'
import { updateChannelSchema } from '@/lib/validations/stash'
import { ZodError } from 'zod'
import { formatChannel } from '@/lib/stash/format'
import type { StashChannelResponse } from '@/types/stash'
import type { ApiResponse } from '@/lib/types/api'

function extractChannelId(url: string): string {
  const segments = new URL(url).pathname.split('/')
  const idx = segments.indexOf('channels')
  return segments[idx + 1]
}

function unauthorized() {
  return NextResponse.json(
    { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
    { status: 401 }
  )
}

function notFound() {
  return NextResponse.json(
    { success: false, error: { code: 'NOT_FOUND', message: 'Channel not found' } },
    { status: 404 }
  )
}

function internalError() {
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
    { status: 500 }
  )
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorized()

    const channelId = extractChannelId(req.url)
    const existing = await prisma.stashChannel.findFirst({
      where: { id: channelId, userId: user.id, isDeleted: false },
    })
    if (!existing) return notFound()

    const body = await req.json()
    const data = updateChannelSchema.parse(body)

    const channel = await prisma.stashChannel.update({
      where: { id: channelId },
      data,
    })

    const response: ApiResponse<StashChannelResponse> = {
      success: true,
      data: formatChannel(channel),
    }
    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ZodError) {
      const details: Record<string, string[]> = {}
      for (const issue of error.issues) {
        const field = issue.path.join('.')
        if (!details[field]) details[field] = []
        details[field].push(issue.message)
      }
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details } },
        { status: 400 }
      )
    }
    return internalError()
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorized()

    const channelId = extractChannelId(req.url)
    const existing = await prisma.stashChannel.findFirst({
      where: { id: channelId, userId: user.id, isDeleted: false },
    })
    if (!existing) return notFound()

    const now = new Date()
    await prisma.$transaction([
      prisma.stashChannel.update({
        where: { id: channelId },
        data: { isDeleted: true, deletedAt: now },
      }),
      prisma.stashMessage.updateMany({
        where: { channelId, isDeleted: false },
        data: { isDeleted: true, deletedAt: now },
      }),
    ])

    return NextResponse.json({ success: true, data: { message: 'Channel deleted' } })
  } catch {
    return internalError()
  }
}
