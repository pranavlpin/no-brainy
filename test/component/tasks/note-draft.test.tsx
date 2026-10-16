import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import NoteDetailPage from '@/app/(dashboard)/notes/[id]/page'

const state = vi.hoisted(() => {
  const values = new Map<string, string>()
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  }
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true })
  return {
    storage,
    values,
    save: vi.fn(),
    note: {
      id: 'note-one',
      userId: 'owner-one',
      title: 'Original',
      contentMd: '',
      tags: [],
      isPinned: false,
      isPublic: false,
      updatedAt: '2026-10-16T00:00:00.000Z',
    },
  }
})
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'note-one' }),
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock('@/stores/ui-store', () => ({ useUIStore: () => () => {} }))
vi.mock('@/hooks/use-notes', () => ({
  useNote: () => ({ data: state.note, refetch: async () => ({ data: state.note }) }),
  useUpdateNote: () => ({ mutate: state.save, mutateAsync: state.save }),
  useDeleteNote: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/use-links', () => ({
  useNoteLinks: () => ({ data: [] }),
  useAddNoteLink: () => ({}),
  useRemoveNoteLink: () => ({}),
}))
vi.mock('@/components/linking/link-manager', () => ({ LinkManager: () => null }))
vi.mock('@/components/editor/markdown-editor', () => ({ MarkdownEditor: () => null }))
vi.mock('@/components/notes/backlinks-panel', () => ({ BacklinksPanel: () => null }))
vi.mock('@/components/notes/note-ai-panel', () => ({ NoteAIPanel: () => null }))
vi.mock('@/components/notes/markdown-cheatsheet', () => ({ MarkdownCheatsheet: () => null }))
vi.mock('@/components/ai/flashcard-generator', () => ({ FlashcardGenerator: () => null }))
vi.mock('@/components/ai/action-items-preview', () => ({ ActionItemsPreview: () => null }))
vi.mock('@/components/ai/ai-action-button', () => ({ AIActionButton: () => null }))

beforeEach(() => {
  vi.useFakeTimers()
  state.storage.clear()
  state.save.mockReset().mockRejectedValue(new Error('Offline'))
  state.note.title = 'Original'
  state.note.updatedAt = '2026-10-16T00:00:00.000Z'
})
afterEach(() => {
  vi.useRealTimers()
})

it('keeps typing through navigation, recovers an offline draft and retries it', async () => {
  const first = render(<NoteDetailPage />)
  fireEvent.change(screen.getByPlaceholderText('Untitled'), {
    target: { value: 'Newest local title' },
  })
  first.unmount()
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600)
  })
  render(<NoteDetailPage />)
  expect(screen.getByPlaceholderText('Untitled')).toHaveValue('Newest local title')
  state.save.mockResolvedValue({
    ...state.note,
    title: 'Newest local title',
    updatedAt: '2026-10-16T00:01:00.000Z',
  })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600)
  })
  expect(state.save).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'note-one', title: 'Newest local title' })
  )
})

it('retains local content but requires a choice when the remote note is newer', async () => {
  const first = render(<NoteDetailPage />)
  fireEvent.change(screen.getByPlaceholderText('Untitled'), { target: { value: 'Local draft' } })
  first.unmount()
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600)
  })
  state.save.mockClear()
  state.note.title = 'Remote title'
  state.note.updatedAt = '2026-10-16T01:00:00.000Z'
  render(<NoteDetailPage />)
  expect(screen.getByPlaceholderText('Untitled')).toHaveValue('Local draft')
  expect(screen.getByText(/changed elsewhere/i)).toBeVisible()
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000)
  })
  expect(state.save).not.toHaveBeenCalled()
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Use current version' }))
  })
  expect(screen.getByPlaceholderText('Untitled')).toHaveValue('Remote title')
})

it('does not let a save from the previous page instance erase a newer draft', async () => {
  let finish!: (value: typeof state.note) => void
  state.save.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve
      })
  )
  const first = render(<NoteDetailPage />)
  fireEvent.change(screen.getByPlaceholderText('Untitled'), { target: { value: 'First draft' } })
  first.unmount()
  render(<NoteDetailPage />)
  fireEvent.change(screen.getByPlaceholderText('Untitled'), { target: { value: 'Newest draft' } })
  await act(async () => {
    finish({ ...state.note, title: 'First draft', updatedAt: '2026-10-16T00:01:00.000Z' })
  })
  expect([...state.values.values()].join('')).toContain('Newest draft')
  expect(screen.getByPlaceholderText('Untitled')).toHaveValue('Newest draft')
})
