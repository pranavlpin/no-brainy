import { act, fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import TasksPage from '@/app/(dashboard)/tasks/page'
import { useUIStore } from '@/stores/ui-store'

const query = vi.hoisted(() =>
  vi.fn((_filters: Record<string, unknown>) => ({
    data: { items: [], page: 1, pageSize: 20, total: 27, hasMore: true },
  }))
)
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/hooks/use-tasks', () => ({
  useTaskPage: query,
  useTasks: () => ({ data: [] }),
  useCreateTask: () => ({}),
}))
vi.mock('@/components/tasks/task-list', () => ({ TaskList: () => null }))
vi.mock('@/components/tasks/eisenhower-matrix', () => ({ EisenhowerMatrix: () => null }))
vi.mock('@/components/tasks/task-ai-panel', () => ({ TaskAIPanel: () => null }))
vi.mock('@/components/tasks/task-form', () => ({ TaskForm: () => null }))

it('defaults to all active work, exposes pagination and resets the page when filters change', () => {
  render(<TasksPage />)
  expect(query).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'active', page: 1 }))
  expect(screen.getByText(/27 tasks/)).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
  expect(query).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
  fireEvent.change(screen.getByPlaceholderText('Search tasks...'), { target: { value: 'Launch' } })
  expect(query).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Launch', page: 1 }))
})

it('applies the chosen workspace context and resets pagination when switching contexts', () => {
  useUIStore.setState({ context: 'all' })
  render(<TasksPage />)
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
  act(() => useUIStore.setState({ context: 'work' }))
  expect(query).toHaveBeenLastCalledWith(expect.objectContaining({ context: 'work', page: 1 }))
  act(() => useUIStore.setState({ context: 'all' }))
  expect(query.mock.calls.at(-1)?.[0]).not.toHaveProperty('context')
})
