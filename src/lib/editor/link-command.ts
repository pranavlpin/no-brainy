import { type CompletionContext, type Completion } from '@codemirror/autocomplete'
import { type EditorView } from '@codemirror/view'

interface NoteItem {
  id: string
  title: string
}

let cachedNotes: NoteItem[] = []
let lastFetchTime = 0
const CACHE_TTL = 10000 // 10 seconds

async function fetchNotes(search?: string): Promise<NoteItem[]> {
  const now = Date.now()

  // Use cache if fresh and no specific search
  if (!search && cachedNotes.length > 0 && now - lastFetchTime < CACHE_TTL) {
    return cachedNotes
  }

  try {
    const params = new URLSearchParams({ pageSize: '50', sortBy: 'updatedAt', sortOrder: 'desc' })
    if (search) params.set('search', search)

    const res = await fetch(`/api/notes?${params}`)
    const data = await res.json()

    if (data.success) {
      const notes = data.data.items.map((n: { id: string; title: string }) => ({
        id: n.id,
        title: n.title || 'Untitled',
      }))

      if (!search) {
        cachedNotes = notes
        lastFetchTime = now
      }

      return notes
    }
  } catch {
    // Silently fail, return cached
  }

  return cachedNotes
}

export function linkCommandCompletions(noteId?: string) {
  return async function (context: CompletionContext): Promise<{ from: number; options: Completion[] } | null> {
    // Match /link or /link followed by search text
    const match = context.matchBefore(/\/link\s*\w*/)
    if (!match) return null

    // Extract search query after "/link "
    const fullText = match.text
    const searchPart = fullText.replace(/^\/link\s*/, '')

    const notes = await fetchNotes(searchPart || undefined)

    // Filter out current note
    const filteredNotes = notes.filter((n) => n.id !== noteId)

    const options: Completion[] = filteredNotes.map((note) => ({
      label: `/link ${note.title}`,
      detail: 'Link to note',
      type: 'text',
      apply: (view: EditorView, _completion: Completion, from: number, to: number) => {
        const wikiLink = `[[${note.title}]]`
        view.dispatch({
          changes: { from, to, insert: wikiLink },
          selection: { anchor: from + wikiLink.length },
        })

        // Create the NoteLink in the background
        if (noteId) {
          createNoteLink(noteId, note.id).catch(() => {
            // Silently fail — link text is still inserted
          })
        }
      },
    }))

    // Add a generic /link option at the top
    if (!searchPart) {
      options.unshift({
        label: '/link',
        detail: 'Type to search notes...',
        type: 'keyword',
        apply: () => { /* no-op, user keeps typing */ },
      })
    }

    return { from: match.from, options }
  }
}

async function createNoteLink(sourceId: string, targetId: string): Promise<void> {
  await fetch(`/api/notes/${sourceId}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetType: 'note', targetId }),
  })
}
