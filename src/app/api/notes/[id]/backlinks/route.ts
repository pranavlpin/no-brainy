import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import type { ApiResponse } from '@/lib/types/api'
import type { BacklinkItem } from '@/lib/types/notes'

function stripMarkdown(text: string): string {
  return text
    .replace(/[#*_~`>\[\]()!]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}

function makeSnippet(text: string, maxLen = 120): string {
  const stripped = stripMarkdown(text)
  if (stripped.length <= maxLen) return stripped
  return stripped.slice(0, maxLen) + '...'
}

export const GET = withAuth(
  async (
    req: NextRequest,
    user
  ) => {
    const url = new URL(req.url)
    const segments = url.pathname.split('/')
    const noteIdIdx = segments.indexOf('notes') + 1
    const noteId = segments[noteIdIdx]

    if (!noteId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Note ID required' } },
        { status: 400 }
      )
    }

    // Verify the note belongs to the user
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId: user.id },
      select: { id: true, title: true },
    })

    if (!note) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Note not found' } },
        { status: 404 }
      )
    }

    // 1. Get backlinks via NoteLink table (targetId = this note)
    const noteLinks = await prisma.noteLink.findMany({
      where: {
        targetId: noteId,
        targetType: 'note',
      },
      include: {
        sourceNote: {
          select: {
            id: true,
            title: true,
            contentMd: true,
            userId: true,
          },
        },
      },
    })

    const backlinks: BacklinkItem[] = []
    const seenIds = new Set<string>()

    for (const link of noteLinks) {
      if (!link.sourceNote) continue
      if (link.sourceNote.userId !== user.id) continue
      if (seenIds.has(link.sourceNote.id)) continue
      seenIds.add(link.sourceNote.id)

      backlinks.push({
        id: link.sourceNote.id,
        title: link.sourceNote.title || 'Untitled Note',
        snippet: makeSnippet(link.sourceNote.contentMd),
        linkedVia: 'notelink',
      })
    }

    // 2. Search for [[NoteTitle]] wiki-link patterns in other notes
    if (note.title) {
      const wikiLinkPattern = `[[${note.title}]]`
      const wikiLinkNotes = await prisma.note.findMany({
        where: {
          userId: user.id,
          isDeleted: false,
          id: { not: noteId },
          contentMd: { contains: wikiLinkPattern },
        },
        select: {
          id: true,
          title: true,
          contentMd: true,
        },
      })

      for (const wikiNote of wikiLinkNotes) {
        if (seenIds.has(wikiNote.id)) continue
        seenIds.add(wikiNote.id)

        backlinks.push({
          id: wikiNote.id,
          title: wikiNote.title || 'Untitled Note',
          snippet: makeSnippet(wikiNote.contentMd),
          linkedVia: 'wikilink',
        })
      }
    }

    const response: ApiResponse<BacklinkItem[]> = {
      success: true,
      data: backlinks,
    }

    return NextResponse.json(response)
  }
)
