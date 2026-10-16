import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/tasks',
}))
vi.mock('@/lib/api-client', () => ({ apiClient: vi.fn(() => new Promise(() => {})) }))
vi.mock('@/hooks/use-ai', () => ({ useAI: () => ({ isEnabled: false, isLoading: false }) }))
const page = vi.fn()
vi.mock('@/hooks/use-tasks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/use-tasks')>()
  return { ...actual, useTaskPage: () => page() }
})

import TasksPage from '@/app/(dashboard)/tasks/page'

describe('TasksPage pagination', () => {
  it('shows total and page, and disables Next on the last page', () => {
    page.mockReturnValue({
      data: { items: [], total: 45, page: 3, pageSize: 20, hasMore: false },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    render(
      <QueryClientProvider client={new QueryClient()}>
        <TasksPage />
      </QueryClientProvider>
    )
    const nav = screen.getByRole('navigation', { name: 'Task pages' })
    expect(nav).toHaveTextContent('45 tasks')
    expect(nav).toHaveTextContent('Page 3 of 3')
    expect(screen.getByTestId('task-next-page')).toBeDisabled()
    expect(screen.getByTestId('task-prev-page')).toBeEnabled()
  })
})
