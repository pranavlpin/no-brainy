import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { it, expect, vi } from 'vitest'
import { CoreBackupSection } from '@/components/settings/core-backup'
import { coreSchemas } from '@/lib/validations/backup'
const call = vi.hoisted(() => vi.fn())
vi.mock('@/lib/api-client', () => ({ apiClient: call }))
it('preview stays read-only until explicit confirmation and keeps retry input after a failure', async () => {
  const counts = Object.fromEntries(Object.keys(coreSchemas).map((k) => [k, 0]))
  call.mockResolvedValueOnce({
    data: {
      imported: counts,
      counts,
      skipped: { dayPlans: [], dailyReviews: [], weeklyReviews: [] },
      fingerprint: 'a'.repeat(64),
      omittedLinks: 0,
      activeSnapshots: 0,
    },
  })
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={cache}>
      <CoreBackupSection />
    </QueryClientProvider>
  )
  const backup = {
    version: 1,
    scope: 'nobrainy-core',
    exportedAt: '2026-10-16T00:00:00.000Z',
    omittedLinks: 0,
    data: Object.fromEntries(Object.keys(coreSchemas).map((k) => [k, []])),
  }
  const file = new File([''], 'core.json', { type: 'application/json' })
  Object.defineProperty(file, 'text', { value: async () => JSON.stringify(backup) })
  fireEvent.change(screen.getByLabelText('Choose core backup'), { target: { files: [file] } })
  await screen.findByRole('button', { name: 'Confirm additive import' })
  expect(call.mock.calls.map((c) => c[0])).toEqual(['/api/data/preview'])
  call.mockRejectedValueOnce({ error: { message: 'Connection interrupted' } })
  fireEvent.click(screen.getByRole('button', { name: 'Confirm additive import' }))
  await screen.findByRole('alert')
  const first = JSON.parse(call.mock.calls[1][1].body)
  expect(first.confirm).toBe(true)
  expect(screen.getByRole('button', { name: 'Confirm additive import' })).toBeEnabled()
  call.mockResolvedValueOnce({ data: { imported: counts, alreadyImported: true } })
  fireEvent.click(screen.getByRole('button', { name: 'Confirm additive import' }))
  await waitFor(() => expect(call).toHaveBeenCalledTimes(3))
  expect(JSON.parse(call.mock.calls[2][1].body).clientRequestId).toBe(first.clientRequestId)
  await screen.findByText('This backup was already imported. No duplicate records were added.')
})
