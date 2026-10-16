import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import TaskDetailPage from '@/app/(dashboard)/tasks/[id]/page'

vi.hoisted(() => {
  const values = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
    },
  })
})
vi.mock('@/stores/ui-store', () => ({ useUIStore: () => () => {} }))
const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  task: {
    id: 'task-one',
    userId: 'owner-one',
    title: 'Original',
    descriptionMd: '',
    priority: 'medium',
    status: 'pending',
    dueDate: null,
    tags: [],
    quadrant: null,
    isRecurring: false,
    rrule: null,
    updatedAt: '2026-10-16T00:00:00.000Z',
    subtasks: [],
  },
}))
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'task-one' }),
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock('@/hooks/use-tasks', () => ({
  useTask: () => ({ data: mocks.task }),
  useUpdateTask: () => ({ mutate: mocks.save, mutateAsync: mocks.save }),
  useDeleteTask: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/hooks/use-links', () => ({
  useTaskLinks: () => ({ data: [] }),
  useAddTaskLink: () => ({}),
  useRemoveTaskLink: () => ({}),
}))
vi.mock('@/components/tasks/subtask-list', () => ({ SubtaskList: () => null }))
vi.mock('@/components/linking/link-manager', () => ({ LinkManager: () => null }))
vi.mock('@/components/editor/markdown-editor', () => ({ MarkdownEditor: () => null }))

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  mocks.save
    .mockReset()
    .mockResolvedValue({ data: { ...mocks.task, updatedAt: '2026-10-16T00:01:00.000Z' } })
})
afterEach(() => {
  vi.useRealTimers()
})

it('saves a title and priority edited inside the same debounce window together', async () => {
  render(<TaskDetailPage />)
  fireEvent.change(screen.getByPlaceholderText('Task title...'), {
    target: { value: 'Keep this title' },
  })
  fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'urgent' } })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(900)
  })
  expect(mocks.save).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 'task-one',
      data: expect.objectContaining({ title: 'Keep this title', priority: 'urgent' }),
    })
  )
})
