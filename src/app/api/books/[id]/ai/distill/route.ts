import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAI } from '@/lib/ai/middleware'
import { callAI } from '@/lib/ai/call-ai'
import { handleAIError } from '@/lib/ai/error-handler'
import { distillBookPrompt } from '@/lib/ai/prompts'

interface DistillResult {
  title: string
  contentMd: string
  suggestedTags: string[]
}

export const POST = withAI(async (req: NextRequest, { user, apiKey }) => {
  const bookId = req.nextUrl.pathname.split('/')[3] // /api/books/[id]/ai/distill

  const book = await prisma.book.findFirst({
    where: { id: bookId, userId: user.id },
  })

  if (!book) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Book not found' } },
      { status: 404 }
    )
  }

  const hasContent =
    book.summaryMd.trim() ||
    (book.keyIdeas as unknown[]).length > 0 ||
    (book.quotes as unknown[]).length > 0 ||
    book.learningsMd.trim()

  if (!hasContent) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CONTENT_TOO_SHORT',
          message: 'This book has no summary, key ideas, quotes, or learnings to distill. Add some content first.',
        },
      },
      { status: 400 }
    )
  }

  try {
    const result = await callAI<DistillResult>({
      apiKey,
      model: distillBookPrompt.model,
      systemPrompt: distillBookPrompt.systemPrompt,
      userPrompt: distillBookPrompt.userPrompt({
        title: book.title,
        author: book.author,
        summaryMd: book.summaryMd,
        keyIdeas: book.keyIdeas as unknown[],
        quotes: book.quotes as unknown[],
        learningsMd: book.learningsMd,
        applicationMd: book.applicationMd,
      }),
      maxTokens: distillBookPrompt.maxTokens,
      temperature: distillBookPrompt.temperature,
      responseFormat: 'json',
    })

    return NextResponse.json(result)
  } catch (error) {
    return handleAIError(error)
  }
})
