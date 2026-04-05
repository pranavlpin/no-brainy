'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'
import type { BacklinkItem, NoteGraph } from '@/lib/types/notes'

const BACKLINKS_KEY = 'backlinks' as const
const NOTE_GRAPH_KEY = 'note-graph' as const

export function useBacklinks(noteId: string) {
  return useQuery({
    queryKey: [BACKLINKS_KEY, noteId],
    queryFn: async () => {
      const res = await apiClient<ApiResponse<BacklinkItem[]>>(
        `/api/notes/${noteId}/backlinks`
      )
      return res.data
    },
    enabled: !!noteId,
  })
}

export function useNoteGraph() {
  return useQuery({
    queryKey: [NOTE_GRAPH_KEY],
    queryFn: async () => {
      const res = await apiClient<ApiResponse<NoteGraph>>(
        `/api/notes/graph`
      )
      return res.data
    },
  })
}
