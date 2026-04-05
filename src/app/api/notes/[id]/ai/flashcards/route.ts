import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAI } from '@/lib/ai/middleware'
import { callAI, AIError } from '@/lib/ai/call-ai'
import { flashcardGeneratePrompt } from '@/lib/ai/prompts/flashcard-generate'
import type { FlashcardGenerationResult } from '@/lib/ai/types'

function extractNoteId(url: string): string {
  const segments = new URL(url).pathname.split('/')
  // /api/notes/[id]/ai/flashcards -> notes is at index 2, id at index 3
  const notesIndex = segments.indexOf('notes')
  return segments[notesIndex + 1]
}

export const POST = withAI(async (req: NextRequest, ctx) => {
  try {
    const noteId = extractNoteId(req.url)

    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        userId: ctx.user.id,
        isDeleted: false,
      },
    })

    if (!note) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Note not found' },
        },
        { status: 404 }
      )
    }

    // Require meaningful content
    const contentLength = (note.contentMd ?? '').trim().length
    if (contentLength < 50) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONTENT_TOO_SHORT',
            message: 'Note content is too short to generate flashcards. Add more content and try again.',
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
        sourceType: 'note',
        title: note.title,
        content: note.contentMd,
      }),
      maxTokens: flashcardGeneratePrompt.maxTokens,
      temperature: flashcardGeneratePrompt.temperature,
      responseFormat: 'json',
    })

    const response: FlashcardGenerationResult = {
      cards: result.data.cards,
      sourceType: 'note',
      sourceId: noteId,
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
