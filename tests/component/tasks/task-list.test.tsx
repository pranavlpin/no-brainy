import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
const apiClient = vi.fn<(...args: unknown[]) => Promise<unknown>>(() => new Promise(() => {}))
vi.mock('@/lib/api-client', () => ({ apiClient: (...a: unknown[]) => apiClient(...a) }))

import { TaskList } from '@/components/tasks/task-list'
import type { TaskResponse } from '@/lib/types/tasks'

function mockReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

const task = (id: string, title: string): TaskResponse => ({
  id,
  userId: 'u1',
  parentTaskId: null,
  goalId: null,
  projectId: null,
  title,
  descriptionMd: '',
  priority: 'medium',
  status: 'pending',
  tags: [],
  dueDate: null,
  completedAt: null,
  isRecurring: false,
  rrule: null,
  quadrant: null,
  orderIndex: 0,
  plannedDate: null,
  estimatedMinutes: null,
  effort: null,
  context: null,
  createdAt: '2026-10-16T00:00:00.000Z',
  updatedAt: '2026-10-16T00:00:00.000Z',
})

function renderList(props: Partial<React.ComponentProps<typeof TaskList>> = {}) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <TaskList tasks={[task('a', 'Alpha'), task('b', 'Beta')]} {...props} />
    </QueryClientProvider>
  )
}

describe('TaskList', () => {
  beforeEach(() => mockReducedMotion(true))
  afterEach(() => mockReducedMotion(false))

  it('renders stable test ids per row and toggle', () => {
    renderList()
    expect(screen.getByTestId('task-row-a')).toHaveTextContent('Alpha')
    expect(screen.getByTestId('task-toggle-b')).toHaveAttribute('role', 'checkbox')
    expect(screen.getByTestId('task-toggle-b')).toHaveAttribute('aria-checked', 'false')
  })

  it('flips aria-checked immediately on click', async () => {
    renderList()
    await userEvent.click(screen.getByTestId('task-toggle-a'))
    expect(screen.getByTestId('task-toggle-a')).toHaveAttribute('aria-checked', 'true')
    expect(apiClient).toHaveBeenCalled()
  })

  it('removes a completed row without delay under reduced motion when hiding completed', async () => {
    renderList({ hideCompleted: true })
    await userEvent.click(screen.getByTestId('task-toggle-a'))
    await act(async () => {})
    expect(screen.queryByTestId('task-row-a')).toBeNull()
    expect(screen.getByTestId('task-row-b')).toBeInTheDocument()
  })
})
