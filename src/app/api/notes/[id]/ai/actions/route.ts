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
  const noteId = req.nextUrl.pathname.split('/')[3] // /api/notes/[id]/ai/actions

  const note = await prisma.note.findFirst({
    where: { id: noteId, userId: user.id, isDeleted: false },
  })

  if (!note) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Note not found' } },
      { status: 404 }
    )
  }

  if (note.contentMd.trim().length < 30) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CONTENT_TOO_SHORT',
          message: 'Note content is too short to extract actions from. Add more content first.',
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
        `Note: "${note.title}"\n\n${note.contentMd}`
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
