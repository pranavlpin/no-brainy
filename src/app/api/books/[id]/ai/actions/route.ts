import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAI } from '@/lib/ai/middleware'
import { callAI } from '@/lib/ai/call-ai'
import { handleAIError } from '@/lib/ai/error-handler'
import { extractActionsPrompt } from '@/lib/ai/prompts'

interface ExtractedTask {
  title: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  reason: string
}

interface ExtractActionsResult {
  tasks: ExtractedTask[]
}

export const POST = withAI(async (req: NextRequest, { user, apiKey }) => {
  const bookId = req.nextUrl.pathname.split('/')[3] // /api/books/[id]/ai/actions

  const book = await prisma.book.findFirst({
    where: { id: bookId, userId: user.id },
  })

  if (!book) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Book not found' } },
      { status: 404 }
    )
  }

  // Build content from book fields
  const parts: string[] = []
  if (book.summaryMd.trim()) parts.push(`Summary:\n${book.summaryMd}`)
  const keyIdeas = book.keyIdeas as unknown[]
  if (keyIdeas.length > 0) parts.push(`Key Ideas:\n${JSON.stringify(keyIdeas)}`)
  if (book.learningsMd.trim()) parts.push(`Learnings:\n${book.learningsMd}`)
  if (book.applicationMd.trim()) parts.push(`Applications:\n${book.applicationMd}`)

  const content = parts.join('\n\n')
  if (!content.trim()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CONTENT_TOO_SHORT',
          message: 'This book has no content to extract actions from. Add a summary, key ideas, or learnings first.',
        },
      },
      { status: 400 }
    )
  }

  try {
    const result = await callAI<ExtractActionsResult>({
      apiKey,
      model: extractActionsPrompt.model,
      systemPrompt: extractActionsPrompt.systemPrompt,
      userPrompt: extractActionsPrompt.userPrompt(
        `Book: "${book.title}" by ${book.author ?? 'Unknown'}\n\n${content}`
      ),
      maxTokens: extractActionsPrompt.maxTokens,
      temperature: extractActionsPrompt.temperature,
      responseFormat: 'json',
    })

    return NextResponse.json(result)
  } catch (error) {
    return handleAIError(error)
  }
})
