import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { processCaptureSchema } from '@/lib/validations/inbox'
import { processCapture } from '@/lib/inbox/process'
import { inboxError, inboxFailure } from '@/lib/inbox/http'

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const id = req.nextUrl.pathname.split('/').at(-2)!
    const input = processCaptureSchema.parse(await req.json())
    const result = await prisma.$transaction((db) => processCapture(db, user.id, id, input))
    if ('error' in result) {
      return result.error === 'not-found'
        ? inboxError('NOT_FOUND', 'Capture not found', 404)
        : inboxError('VALIDATION_ERROR', 'Add a web link to save this as a bookmark', 400)
    }
    return NextResponse.json({ success: true, data: result.capture })
  } catch (error) {
    return inboxFailure(error)
  }
})
