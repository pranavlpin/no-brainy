import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { undoCapture } from '@/lib/inbox/process'
import { inboxError, inboxFailure } from '@/lib/inbox/http'

/** Reverse a processing decision: remove what it created and reopen the capture. */
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const id = req.nextUrl.pathname.split('/').at(-2)!
    const result = await prisma.$transaction((db) => undoCapture(db, user.id, id))
    if ('error' in result) return inboxError('NOT_FOUND', 'Capture not found', 404)
    return NextResponse.json({ success: true, data: result.capture })
  } catch (error) {
    return inboxFailure(error)
  }
})
