import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { readWeekly, saveWeekly, reviewFailure } from '@/lib/reviews/server'
const dateFrom = (req: NextRequest) => req.nextUrl.pathname.split('/').at(-1)!
export const GET = withAuth(async (req, user) => {
  try {
    return NextResponse.json({ success: true, data: await readWeekly(user, dateFrom(req)) })
  } catch (error) {
    return reviewFailure(error)
  }
})
export const PUT = withAuth(async (req, user) => {
  try {
    return NextResponse.json({
      success: true,
      data: await saveWeekly(user, dateFrom(req), await req.json()),
    })
  } catch (error) {
    return reviewFailure(error)
  }
})
