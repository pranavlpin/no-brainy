import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import type { ReviewSessionResponse } from '@/lib/types/flashcards'
import type { ApiResponse } from '@/lib/types/api'

function extractSessionId(url: string): string {
  const parts = new URL(url).pathname.split('/')
  // /api/review-sessions/[id]/complete -> parts = ['', 'api', 'review-sessions', '<id>', 'complete']
  return parts[3]
}

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const sessionId = extractSessionId(req.url)

    const session = await prisma.reviewSession.findFirst({
      where: { id: sessionId, userId: user.id },
    })

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Review session not found' },
        },
        { status: 404 }
      )
    }

    if (session.completedAt) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Review session already completed' },
        },
        { status: 400 }
      )
    }

    const updated = await prisma.reviewSession.update({
      where: { id: sessionId },
      data: { completedAt: new Date() },
    })

    const response: ApiResponse<ReviewSessionResponse> = {
      success: true,
      data: {
        id: updated.id,
        userId: updated.userId,
        deckId: updated.deckId,
        startedAt: updated.startedAt.toISOString(),
        completedAt: updated.completedAt?.toISOString() ?? null,
        cardsReviewed: updated.cardsReviewed,
        cardsEasy: updated.cardsEasy,
        cardsMedium: updated.cardsMedium,
        cardsHard: updated.cardsHard,
        cardsForgot: updated.cardsForgot,
      },
    }

    return NextResponse.json(response)
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})
