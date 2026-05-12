import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth/middleware'
import { updateMessageSchema } from '@/lib/validations/stash'
import { ZodError } from 'zod'
import { formatMessage } from '@/lib/stash/format'
import { encryptContent, decryptContent } from '@/lib/stash/encrypt-message'
import type { StashMessageResponse } from '@/types/stash'
import type { ApiResponse } from '@/lib/types/api'

function extractMessageId(url: string): string {
  const segments = new URL(url).pathname.split('/')
  const idx = segments.indexOf('messages')
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
    { success: false, error: { code: 'NOT_FOUND', message: 'Message not found' } },
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

    const messageId = extractMessageId(req.url)
    const existing = await prisma.stashMessage.findFirst({
      where: { id: messageId, userId: user.id, isDeleted: false },
    })
    if (!existing) return notFound()

    const body = await req.json()
    const data = updateMessageSchema.parse(body)

    const updatePayload: Record<string, unknown> = { ...data }
    let plaintextContent: string | undefined
    if (data.content !== undefined) {
      const { content: storedContent, isEncrypted } = encryptContent(
        data.content,
        existing.isEncrypted
      )
      updatePayload.content = storedContent
      updatePayload.isEncrypted = isEncrypted
      plaintextContent = data.content
    }

    const message = await prisma.stashMessage.update({
      where: { id: messageId },
      data: updatePayload,
    })

    const response: ApiResponse<StashMessageResponse> = {
      success: true,
      data: formatMessage({
        ...message,
        content: plaintextContent ?? decryptContent(message.content, message.isEncrypted),
      }),
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

    const messageId = extractMessageId(req.url)
    const existing = await prisma.stashMessage.findFirst({
      where: { id: messageId, userId: user.id, isDeleted: false },
    })
    if (!existing) return notFound()

    await prisma.stashMessage.update({
      where: { id: messageId },
      data: { isDeleted: true, deletedAt: new Date() },
    })

    return NextResponse.json({ success: true, data: { message: 'Message deleted' } })
  } catch {
    return internalError()
  }
}
