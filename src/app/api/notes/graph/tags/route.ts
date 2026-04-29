import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import type { ApiResponse } from '@/lib/types/api'
import type { NoteGraph, GraphNode, GraphEdge } from '@/lib/types/notes'

export const GET = withAuth(async (_req: NextRequest, user) => {
  try {
    const notes = await prisma.note.findMany({
      where: {
        userId: user.id,
        isDeleted: false,
      },
      select: {
        id: true,
        title: true,
        tags: true,
      },
    })

    // Build tag → note IDs map
    const tagToNotes = new Map<string, string[]>()
    for (const note of notes) {
      for (const tag of note.tags) {
        if (!tagToNotes.has(tag)) tagToNotes.set(tag, [])
        tagToNotes.get(tag)!.push(note.id)
      }
    }

    // Build edges: connect notes that share at least one tag
    const edgeSet = new Set<string>()
    const edges: GraphEdge[] = []

    for (const noteIds of tagToNotes.values()) {
      // Connect all pairs of notes with this tag
      for (let i = 0; i < noteIds.length; i++) {
        for (let j = i + 1; j < noteIds.length; j++) {
          const key = [noteIds[i], noteIds[j]].sort().join('|')
          if (!edgeSet.has(key)) {
            edgeSet.add(key)
            edges.push({ source: noteIds[i], target: noteIds[j] })
          }
        }
      }
    }

    // Only include notes that have at least one tag (otherwise they'd be disconnected)
    const connectedIds = new Set<string>()
    for (const edge of edges) {
      connectedIds.add(edge.source)
      connectedIds.add(edge.target)
    }

    // Also include notes with tags but no connections (single-tag notes)
    for (const note of notes) {
      if (note.tags.length > 0) connectedIds.add(note.id)
    }

    const nodes: GraphNode[] = notes
      .filter((n) => connectedIds.has(n.id))
      .map((n) => ({
        id: n.id,
        title: n.title || 'Untitled Note',
        tags: n.tags,
      }))

    const response: ApiResponse<NoteGraph> = {
      success: true,
      data: { nodes, edges },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Tag graph error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})
