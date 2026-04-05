import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { AIActionResponse, NoteSummary, NoteInsights, TagSuggestions } from '@/lib/ai/types'

export function useNoteSummarize(noteId: string) {
  return useMutation({
    mutationFn: () =>
      apiClient<AIActionResponse<NoteSummary>>(`/api/notes/${noteId}/ai/summarize`, {
        method: 'POST',
      }),
  })
}

export function useNoteInsights(noteId: string) {
  return useMutation({
    mutationFn: () =>
      apiClient<AIActionResponse<NoteInsights>>(`/api/notes/${noteId}/ai/insights`, {
        method: 'POST',
      }),
  })
}

export function useNoteTagSuggestions(noteId: string) {
  return useMutation({
    mutationFn: () =>
      apiClient<AIActionResponse<TagSuggestions>>(`/api/notes/${noteId}/ai/tags`, {
        method: 'POST',
      }),
  })
}
