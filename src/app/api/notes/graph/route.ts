import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import type { ApiResponse } from '@/lib/types/api'
import type { NoteGraph, GraphNode, GraphEdge } from '@/lib/types/notes'

export const GET = withAuth(async (_req: NextRequest, user) => {
  // Get all user's non-deleted notes
  const notes = await prisma.note.findMany({
    where: {
      userId: user.id,
      isDeleted: false,
    },
    select: {
      id: true,
      title: true,
    },
  })

  const noteIds = new Set(notes.map((n) => n.id))

  // Get all note-to-note links where both source and target belong to the user
  const links = await prisma.noteLink.findMany({
    where: {
      targetType: 'note',
      sourceId: { in: Array.from(noteIds) },
      targetId: { in: Array.from(noteIds) },
    },
    select: {
      sourceId: true,
      targetId: true,
    },
  })

  const nodes: GraphNode[] = notes.map((n) => ({
    id: n.id,
    title: n.title || 'Untitled Note',
  }))

  const edges: GraphEdge[] = links.map((l) => ({
    source: l.sourceId,
    target: l.targetId,
  }))

  const response: ApiResponse<NoteGraph> = {
    success: true,
    data: { nodes, edges },
  }

  return NextResponse.json(response)
})
