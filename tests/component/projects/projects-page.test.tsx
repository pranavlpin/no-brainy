import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => '/projects' }))
vi.mock('@/lib/api-client', () => ({ apiClient: vi.fn(() => new Promise(() => {})) }))
const list = vi.fn()
vi.mock('@/hooks/use-projects', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/use-projects')>()
  return { ...actual, useProjects: () => list() }
})

import ProjectsPage from '@/app/(dashboard)/projects/page'

const project = (id: string, over: Record<string, unknown>) => ({
  id,
  userId: 'u1',
  title: `Project ${id}`,
  outcome: '',
  context: 'personal',
  status: 'active',
  goalId: null,
  nextActionId: null,
  nextAction: null,
  tasks: [],
  notes: [],
  taskCount: 0,
  completedTaskCount: 0,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  ...over,
})

describe('ProjectsPage', () => {
  it('renders a card per project with progress and the next action', () => {
    list.mockReturnValue({
      data: [
        project('a', {
          taskCount: 4,
          completedTaskCount: 1,
          nextAction: { id: 't1', title: 'Write the landing page', status: 'pending' },
        }),
        project('b', {}),
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ProjectsPage />
      </QueryClientProvider>
    )
    const a = screen.getByTestId('project-a')
    expect(a).toHaveTextContent('1 of 4 done')
    expect(a).toHaveTextContent('Write the landing page')
    expect(screen.getByTestId('project-b')).toHaveTextContent(/choose a next step/i)
  })
})
