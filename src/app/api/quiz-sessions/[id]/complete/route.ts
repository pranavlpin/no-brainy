import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import type { ApiResponse } from '@/lib/types/api'
import type { QuizSessionResponse, QuizMode, QuizAnswerEntry } from '@/lib/types/flashcards'

function extractSessionId(url: string): string {
  const parts = new URL(url).pathname.split('/')
  return parts[3]
}

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const sessionId = extractSessionId(req.url)

    const session = await prisma.quizSession.findFirst({
      where: { id: sessionId, userId: user.id },
    })

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Quiz session not found' },
        },
        { status: 404 }
      )
    }

    if (session.completedAt) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Quiz session already completed' },
        },
        { status: 400 }
      )
    }

    const now = new Date()
    const timeUsedSec = Math.round(
      (now.getTime() - session.startedAt.getTime()) / 1000
    )
    const scorePercent =
      session.totalCards > 0
        ? Math.round((session.correctCount / session.totalCards) * 100)
        : 0

    const updated = await prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        completedAt: now,
        timeUsedSec,
        scorePercent,
      },
    })

    const answers = (updated.answers as unknown as QuizAnswerEntry[]) ?? []

    const response: ApiResponse<QuizSessionResponse> = {
      success: true,
      data: {
        id: updated.id,
        userId: updated.userId,
        deckId: updated.deckId,
        mode: updated.mode as QuizMode,
        totalCards: updated.totalCards,
        correctCount: updated.correctCount,
        incorrectCount: updated.incorrectCount,
        skippedCount: updated.skippedCount,
        scorePercent: updated.scorePercent,
        timeLimitSec: updated.timeLimitSec,
        timeUsedSec: updated.timeUsedSec,
        startedAt: updated.startedAt.toISOString(),
        completedAt: updated.completedAt?.toISOString() ?? null,
        answers,
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
