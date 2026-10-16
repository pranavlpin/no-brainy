import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { captureStateSchema } from '@/lib/validations/inbox'
import { inboxError, inboxFailure } from '@/lib/inbox/server'

export const PATCH = withAuth(async (req: NextRequest, user) => {
  try {
    const id = req.nextUrl.pathname.split('/').pop()!
    const data = captureStateSchema.parse(await req.json())
    const changed = await prisma.capture.updateMany({ where: { id, userId: user.id }, data })
    if (!changed.count) return inboxError('NOT_FOUND', 'Capture not found', 404)
    return NextResponse.json({
      success: true,
      data: await prisma.capture.findUniqueOrThrow({ where: { id } }),
    })
  } catch (error) {
    return inboxFailure(error)
  }
})
