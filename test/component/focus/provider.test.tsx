import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { FocusProvider } from '@/hooks/use-focus'
const auth = vi.hoisted(() => ({ user: undefined as { id: string } | undefined, isLoading: true }))
vi.mock('@/hooks/use-auth', () => ({ useAuth: () => auth }))
vi.mock('@/lib/api-client', () => ({
  apiClient: async () => ({
    success: true,
    data: { active: null, recent: [], serverNow: new Date().toISOString() },
  }),
}))
it('waits for the owner before exposing editable workspace content, preventing a late session remount from losing a form', () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const view = () => (
    <QueryClientProvider client={client}>
      <FocusProvider>
        <input aria-label="Project draft" />
      </FocusProvider>
    </QueryClientProvider>
  )
  const { rerender } = render(view())
  expect(screen.queryByLabelText('Project draft')).not.toBeInTheDocument()
  auth.user = { id: 'owner' }
  auth.isLoading = false
  rerender(view())
  expect(screen.getByLabelText('Project draft')).toBeVisible()
})
