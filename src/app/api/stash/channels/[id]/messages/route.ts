import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth/middleware'
import { createMessageSchema, messageQuerySchema } from '@/lib/validations/stash'
import { ZodError } from 'zod'
import { formatMessage } from '@/lib/stash/format'
import type { StashMessageResponse, MessagesPage } from '@/types/stash'
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

function validationErrorResponse(error: ZodError) {
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

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorized()

    const channelId = extractChannelId(req.url)
    const channel = await prisma.stashChannel.findFirst({
      where: { id: channelId, userId: user.id, isDeleted: false },
      select: { id: true },
    })
    if (!channel) return notFound()

    const { searchParams } = new URL(req.url)
    const queryObj: Record<string, string> = {}
    searchParams.forEach((v, k) => { queryObj[k] = v })
    const { cursor, limit } = messageQuerySchema.parse(queryObj)

    const messages = await prisma.stashMessage.findMany({
      where: { channelId, isDeleted: false },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hasMore = messages.length > limit
    const items = hasMore ? messages.slice(0, limit) : messages
    const nextCursor = hasMore ? items[items.length - 1].id : null

    const response: ApiResponse<MessagesPage> = {
      success: true,
      data: { items: items.map(formatMessage), nextCursor },
    }
    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error)
    return internalError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorized()

    const channelId = extractChannelId(req.url)
    const channel = await prisma.stashChannel.findFirst({
      where: { id: channelId, userId: user.id, isDeleted: false },
    })
    if (!channel) return notFound()

    const body = await req.json()
    const data = createMessageSchema.parse(body)

    if (data.type === 'TEXT' && data.content.trim().length === 0 && !data.label) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Message cannot be empty' } },
        { status: 400 }
      )
    }

    const now = new Date()
    const [message] = await prisma.$transaction([
      prisma.stashMessage.create({
        data: {
          channelId,
          userId: user.id,
          type: data.type,
          label: data.label,
          content: data.content,
          isEncrypted: false,
          linkUrl: data.linkUrl,
          linkTitle: data.linkTitle,
          linkDescription: data.linkDescription,
          linkImageUrl: data.linkImageUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          fileMimeType: data.fileMimeType,
          fileGcsObject: data.fileGcsObject,
        },
      }),
      prisma.stashChannel.update({
        where: { id: channelId },
        data: { lastMessageAt: now },
      }),
    ])

    const response: ApiResponse<StashMessageResponse> = {
      success: true,
      data: formatMessage(message),
    }
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error)
    return internalError()
  }
}
