import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { TaskPicker } from '@/components/planner/task-picker'
import type { TaskFilters } from '@/lib/types/tasks'

const query = vi.hoisted(() =>
  vi.fn((filters: TaskFilters) => ({
    data: {
      items: [
        {
          id: filters.page === 2 ? 'later' : 'first',
          title: filters.page === 2 ? 'Undated practice' : 'First action',
          status: 'pending',
          priority: 'medium',
          dueDate: null,
        },
      ],
      total: 25,
      page: filters.page ?? 1,
      pageSize: 20,
      hasMore: filters.page !== 2,
    },
  }))
)
vi.mock('@/hooks/use-tasks', () => ({ useTaskPage: query }))

it('reaches undated active actions beyond the first page and resets search pagination', () => {
  const select = vi.fn()
  render(<TaskPicker onSelect={select} />)
  expect(query).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'active', page: 1 }))
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
  fireEvent.click(screen.getByRole('button', { name: 'Choose Undated practice' }))
  expect(select).toHaveBeenCalledWith(expect.objectContaining({ id: 'later', dueDate: null }))
  fireEvent.change(screen.getByLabelText('Search active tasks'), { target: { value: 'Practice' } })
  expect(query).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Practice', page: 1 }))
  expect(query.mock.calls.at(-1)?.[0]).not.toHaveProperty('dueDateFrom')
})
