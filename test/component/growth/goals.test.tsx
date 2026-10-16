import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { useGoals } from '@/hooks/use-goals'
import { GoalForm } from '@/components/goals/goal-form'
import { apiClient } from '@/lib/api-client'
vi.mock('@/lib/api-client', () => ({ apiClient: vi.fn() }))
vi.mock('@/hooks/use-expense-categories', () => ({ useExpenseCategories: () => ({ data: [] }) }))
it('loads every goal page for relationship selectors instead of stopping at twenty', async () => {
  vi.mocked(apiClient).mockImplementation(async (url) => {
    const page = Number(new URL(url, 'http://localhost:3100').searchParams.get('page') ?? 1)
    return {
      success: true,
      data: {
        items:
          page === 1
            ? Array.from({ length: 100 }, (_, i) => ({ id: `g${i}`, title: `Goal ${i}` }))
            : [{ id: 'last', title: 'Beyond page one' }],
        page,
        pageSize: 100,
        total: 101,
        hasMore: page === 1,
      },
    }
  })
  function Consumer() {
    const goals = useGoals()
    return <p>{goals.data?.map((g) => g.title).join(',')}</p>
  }
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <Consumer />
    </QueryClientProvider>
  )
  await waitFor(() => expect(screen.getByText(/Beyond page one/)).toBeVisible())
  expect(vi.mocked(apiClient)).toHaveBeenCalledTimes(2)
})
it('saves explicit outcome criteria and measurement separately from task counts', async () => {
  const submit = vi.fn()
  const user = userEvent.setup()
  render(<GoalForm onSubmit={submit} onCancel={() => undefined} />)
  await user.type(screen.getByLabelText('Title'), 'Explain one concept')
  await user.type(screen.getByLabelText('Success criteria'), 'Explain it without notes')
  await user.type(screen.getByLabelText('Baseline'), '1')
  await user.type(screen.getByLabelText('Target measurement'), '5')
  await user.type(screen.getByLabelText('Measurement unit'), 'explanations')
  await user.type(screen.getByLabelText('Weekly practice target'), '3')
  await user.click(screen.getByRole('button', { name: 'Create Goal' }))
  expect(submit).toHaveBeenCalledWith(
    expect.objectContaining({
      successCriteria: 'Explain it without notes',
      baseline: 1,
      target: 5,
      unit: 'explanations',
      weeklyPracticeTarget: 3,
    })
  )
})
