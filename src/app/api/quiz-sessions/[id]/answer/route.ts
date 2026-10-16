import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import type { ApiResponse } from '@/lib/types/api'
import type {
  QuizSessionResponse,
  QuizMode,
  QuizAnswerEntry,
  QuizAnswer,
} from '@/lib/types/flashcards'

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

    const result = await prisma.$transaction(async (db) => {
      await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
      const session = await db.quizSession.findFirst({ where: { id: sessionId, userId: user.id } })
      if (!session) return { error: 'Quiz session not found', status: 404 } as const
      if (session.completedAt)
        return { error: 'Quiz session already completed', status: 400 } as const
      const card = await db.flashcard.findFirst({
        where: { id: cardId, userId: user.id, deckId: session.deckId },
      })
      if (!card) return { error: 'Choose a card from this quiz deck', status: 400 } as const
      const currentAnswers = (session.answers as unknown as QuizAnswerEntry[]) ?? []
      const prior = currentAnswers.findIndex((entry) => entry.cardId === cardId)
      if (prior < 0 && currentAnswers.length >= session.totalCards)
        return { error: 'All quiz answers are already recorded', status: 400 } as const
      const newAnswers =
        prior < 0
          ? [...currentAnswers, { cardId, answer }]
          : currentAnswers.map((entry, index) => (index === prior ? { cardId, answer } : entry))
      const updated = await db.quizSession.update({
        where: { id: sessionId },
        data: {
          answers: newAnswers.map((entry) => ({ cardId: entry.cardId, answer: entry.answer })),
          correctCount: newAnswers.filter((a) => a.answer === 'correct').length,
          incorrectCount: newAnswers.filter((a) => a.answer === 'incorrect').length,
          skippedCount: newAnswers.filter((a) => a.answer === 'skipped').length,
        },
      })
      return { updated, newAnswers }
    })
    if ('error' in result)
      return NextResponse.json(
        { success: false, error: { code: 'QUIZ_ERROR', message: result.error } },
        { status: result.status }
      )
    const { updated, newAnswers } = result

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
