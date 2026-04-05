import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAI } from '@/lib/ai/middleware'
import { callAI, AIError } from '@/lib/ai/call-ai'
import { flashcardGeneratePrompt } from '@/lib/ai/prompts/flashcard-generate'
import type { FlashcardGenerationResult } from '@/lib/ai/types'

function extractBookId(req: NextRequest): string {
  const segments = new URL(req.url).pathname.split('/')
  // /api/books/[id]/ai/flashcards -> books is at index 2, id at index 3
  const booksIndex = segments.indexOf('books')
  return segments[booksIndex + 1]
}

function buildBookContent(book: {
  summaryMd: string
  keyIdeas: unknown
  quotes: unknown
  learningsMd: string
}): string {
  const parts: string[] = []

  if (book.summaryMd?.trim()) {
    parts.push(`## Summary\n${book.summaryMd}`)
  }

  const ideas = Array.isArray(book.keyIdeas) ? book.keyIdeas : []
  if (ideas.length > 0) {
    parts.push(`## Key Ideas\n${ideas.map((idea, i) => `${i + 1}. ${idea}`).join('\n')}`)
  }

  const quotes = Array.isArray(book.quotes) ? book.quotes : []
  if (quotes.length > 0) {
    const quotesText = quotes
      .map((q: unknown) => {
        if (typeof q === 'string') return `> ${q}`
        if (typeof q === 'object' && q !== null && 'text' in q) {
          const quote = q as { text: string; page?: string }
          return quote.page ? `> "${quote.text}" (p. ${quote.page})` : `> "${quote.text}"`
        }
        return ''
      })
      .filter(Boolean)
      .join('\n')
    if (quotesText) {
      parts.push(`## Quotes\n${quotesText}`)
    }
  }

  if (book.learningsMd?.trim()) {
    parts.push(`## Learnings\n${book.learningsMd}`)
  }

  return parts.join('\n\n')
}

export const POST = withAI(async (req: NextRequest, ctx) => {
  try {
    const bookId = extractBookId(req)

    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        userId: ctx.user.id,
      },
    })

    if (!book) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Book not found' },
        },
        { status: 404 }
      )
    }

    const content = buildBookContent(book)
    if (content.trim().length < 50) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONTENT_TOO_SHORT',
            message: 'Book content is too short to generate flashcards. Add a summary, key ideas, or quotes first.',
          },
        },
        { status: 400 }
      )
    }

    const result = await callAI<{ cards: FlashcardGenerationResult['cards'] }>({
      apiKey: ctx.apiKey,
      model: flashcardGeneratePrompt.model,
      systemPrompt: flashcardGeneratePrompt.systemPrompt,
      userPrompt: flashcardGeneratePrompt.userPrompt({
        sourceType: 'book',
        title: book.title,
        content,
      }),
      maxTokens: flashcardGeneratePrompt.maxTokens,
      temperature: flashcardGeneratePrompt.temperature,
      responseFormat: 'json',
    })

    const response: FlashcardGenerationResult = {
      cards: result.data.cards,
      sourceType: 'book',
      sourceId: bookId,
    }

    return NextResponse.json({
      success: true,
      data: response,
      model: result.model,
      tokensUsed: result.tokensUsed,
    })
  } catch (error) {
    if (error instanceof AIError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: error.code, message: error.message },
        },
        { status: 502 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    )
  }
})
