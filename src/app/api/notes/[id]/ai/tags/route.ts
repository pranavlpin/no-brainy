import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAI } from '@/lib/ai/middleware'
import { callAI } from '@/lib/ai/call-ai'
import { handleAIError } from '@/lib/ai/error-handler'
import { noteTagsPrompt } from '@/lib/ai/prompts'
import type { TagSuggestions } from '@/lib/ai/types'

export const POST = withAI(async (req: NextRequest, { user, apiKey }) => {
  const noteId = req.nextUrl.pathname.split('/')[3] // /api/notes/[id]/ai/tags

  const note = await prisma.note.findFirst({
    where: { id: noteId, userId: user.id, isDeleted: false },
  })

  if (!note) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Note not found' } },
      { status: 404 }
    )
  }

  if (note.contentMd.trim().length < 50) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CONTENT_TOO_SHORT',
          message: 'Note content is too short to suggest tags. Add more content first.',
        },
      },
      { status: 400 }
    )
  }

  try {
    const result = await callAI<TagSuggestions>({
      apiKey,
      model: noteTagsPrompt.model,
      systemPrompt: noteTagsPrompt.systemPrompt,
      userPrompt: noteTagsPrompt.userPrompt({
        title: note.title,
        content: note.contentMd,
        existingTags: note.tags,
      }),
      maxTokens: noteTagsPrompt.maxTokens,
      temperature: noteTagsPrompt.temperature,
      responseFormat: 'json',
    })

    return NextResponse.json(result)
  } catch (error) {
    return handleAIError(error)
  }
})
