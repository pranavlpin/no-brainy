import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import type { ApiResponse } from '@/lib/types/api'
import type {
  QuizSessionResponse,
  QuizCardData,
  StartQuizResponse,
  QuizMode,
} from '@/lib/types/flashcards'

function extractDeckId(url: string): string {
  const parts = new URL(url).pathname.split('/')
  return parts[3]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const deckId = extractDeckId(req.url)
    const body = await req.json()
    const mode: QuizMode = body.mode ?? 'standard'
    const cardLimit: number | undefined = body.cardLimit
    const timeLimitSec: number | undefined = body.timeLimitSec

    // Verify deck belongs to user
    const deck = await prisma.deck.findFirst({
      where: { id: deckId, userId: user.id },
    })

    if (!deck) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Deck not found' },
        },
        { status: 404 }
      )
    }

    // Get all cards in deck
    const allCards = await prisma.flashcard.findMany({
      where: { deckId, userId: user.id },
    })

    if (allCards.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Deck has no cards' },
        },
        { status: 400 }
      )
    }

    // Shuffle and limit
    let quizCards = shuffle(allCards)
    if (cardLimit && cardLimit > 0 && cardLimit < quizCards.length) {
      quizCards = quizCards.slice(0, cardLimit)
    }

    // Create quiz session
    const session = await prisma.quizSession.create({
      data: {
        userId: user.id,
        deckId,
        mode,
        totalCards: quizCards.length,
        timeLimitSec: timeLimitSec ?? null,
        answers: [],
      },
    })

    // Build card data
    const cards: QuizCardData[] = quizCards.map((card) => {
      const cardData: QuizCardData = {
        id: card.id,
        frontMd: card.frontMd,
        backMd: card.backMd,
      }

      if (mode === 'multiple_choice') {
        // Generate 3 wrong options from other cards in deck
        const otherCards = allCards.filter((c) => c.id !== card.id)
        const wrongOptions = shuffle(otherCards)
          .slice(0, 3)
          .map((c) => c.backMd)
        // Combine correct + wrong and shuffle
        cardData.options = shuffle([card.backMd, ...wrongOptions])
      }

      return cardData
    })

    const sessionResponse: QuizSessionResponse = {
      id: session.id,
      userId: session.userId,
      deckId: session.deckId,
      mode: session.mode as QuizMode,
      totalCards: session.totalCards,
      correctCount: session.correctCount,
      incorrectCount: session.incorrectCount,
      skippedCount: session.skippedCount,
      scorePercent: session.scorePercent,
      timeLimitSec: session.timeLimitSec,
      timeUsedSec: session.timeUsedSec,
      startedAt: session.startedAt.toISOString(),
      completedAt: null,
      answers: [],
    }

    const response: ApiResponse<StartQuizResponse> = {
      success: true,
      data: {
        session: sessionResponse,
        cards,
      },
    }

    return NextResponse.json(response, { status: 201 })
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
