import { render, screen } from '@testing-library/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { it, expect, vi } from 'vitest'
import { Providers } from '@/components/providers'
import { useUIStore } from '@/stores/ui-store'
const account = vi.hoisted(() => ({ id: 'first' }))
vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => ({ data: { user: { id: account.id } }, status: 'authenticated' }),
}))
vi.mock('@/components/theme-initializer', () => ({ ThemeInitializer: () => null }))
function PrivateData() {
  const cache = useQueryClient()
  if (account.id === 'first') cache.setQueryData(['private-content'], 'First owner private note')
  const query = useQuery({
    queryKey: ['private-content'],
    queryFn: async () => 'Second owner data',
    enabled: false,
  })
  return <p>{query.data ?? 'Empty new account'}</p>
}
it('never reuses a previous account query cache after an identity change', () => {
  const { rerender } = render(
    <Providers>
      <PrivateData />
    </Providers>
  )
  expect(screen.getByText('First owner private note')).toBeInTheDocument()
  useUIStore.setState({ focusMode: true, focusTaskId: 'first-owner-task' })
  account.id = 'second'
  rerender(
    <Providers>
      <PrivateData />
    </Providers>
  )
  expect(screen.queryByText('First owner private note')).toBeNull()
  expect(screen.getByText('Empty new account')).toBeInTheDocument()
  expect(useUIStore.getState().focusTaskId).toBeNull()
  expect(useUIStore.getState().focusMode).toBe(false)
})
