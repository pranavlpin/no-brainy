import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { createChannelSchema } from '@/lib/validations/stash'
import { ZodError } from 'zod'
import { formatChannel } from '@/lib/stash/format'
import type { StashChannelResponse } from '@/types/stash'
import type { ApiResponse } from '@/lib/types/api'

function validationErrorResponse(error: ZodError) {
  const details: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const field = issue.path.join('.')
    if (!details[field]) details[field] = []
    details[field].push(issue.message)
  }
  return NextResponse.json(
    {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details },
    },
    { status: 400 }
  )
}

function internalErrorResponse() {
  return NextResponse.json(
    {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    },
    { status: 500 }
  )
}

export const GET = withAuth(async (_req: NextRequest, user) => {
  try {
    const channels = await prisma.stashChannel.findMany({
      where: { userId: user.id, isDeleted: false },
      orderBy: [
        { isPinned: 'desc' },
        { lastMessageAt: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
    })

    const response: ApiResponse<StashChannelResponse[]> = {
      success: true,
      data: channels.map(formatChannel),
    }
    return NextResponse.json(response)
  } catch {
    return internalErrorResponse()
  }
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const data = createChannelSchema.parse(body)

    const channel = await prisma.stashChannel.create({
      data: {
        userId: user.id,
        name: data.name,
        icon: data.icon,
        color: data.color,
        isSensitive: data.isSensitive,
      },
    })

    const response: ApiResponse<StashChannelResponse> = {
      success: true,
      data: formatChannel(channel),
    }
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error)
    return internalErrorResponse()
  }
})
