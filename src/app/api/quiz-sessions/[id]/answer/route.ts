import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import type { ApiResponse } from '@/lib/types/api'
import type { QuizSessionResponse, QuizMode, QuizAnswerEntry, QuizAnswer } from '@/lib/types/flashcards'

function extractSessionId(url: string): string {
  const parts = new URL(url).pathname.split('/')
  // /api/quiz-sessions/[id]/answer -> parts = ['', 'api', 'quiz-sessions', '<id>', 'answer']
  return parts[3]
}

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const sessionId = extractSessionId(req.url)
    const body = await req.json()
    const cardId: string = body.cardId
    const answer: QuizAnswer = body.answer

    if (!cardId || !['correct', 'incorrect', 'skipped'].includes(answer)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'BAD_REQUEST', message: 'cardId and valid answer required' },
        },
        { status: 400 }
      )
    }

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

    const currentAnswers = (session.answers as unknown as QuizAnswerEntry[]) ?? []
    const newAnswers = [...currentAnswers, { cardId, answer }]

    const correctCount = newAnswers.filter((a) => a.answer === 'correct').length
    const incorrectCount = newAnswers.filter((a) => a.answer === 'incorrect').length
    const skippedCount = newAnswers.filter((a) => a.answer === 'skipped').length

    const updated = await prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        answers: newAnswers as unknown as any,
        correctCount,
        incorrectCount,
        skippedCount,
      },
    })

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
        answers: newAnswers,
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
