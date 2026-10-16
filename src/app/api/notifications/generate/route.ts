import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { generateForUser } from '@/lib/notifications/generate'

/** Client-triggered generation for the signed-in user (the cron route covers everyone). */
export const POST = withAuth(async (_req: NextRequest, user) => {
  try {
    const { created } = await generateForUser(user)
    return NextResponse.json({
      success: true,
      data: { generated: created.length, notifications: created },
    })
  } catch (error) {
    console.error('[notifications/generate]', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})
