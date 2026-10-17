import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => '/' }))
vi.mock('@/hooks/use-user-today', () => ({
  useUserToday: () => ({ today: '2026-10-16', timezone: 'Asia/Kolkata' }),
}))
const apiClient = vi.fn<(...a: unknown[]) => Promise<unknown>>()
vi.mock('@/lib/api-client', () => ({ apiClient: (...a: unknown[]) => apiClient(...a) }))

import { QuickCaptureModal } from '@/components/quick-capture/quick-capture-modal'

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('QuickCaptureModal', () => {
  beforeEach(() => {
    apiClient.mockReset()
    apiClient.mockImplementation(async (url: unknown) => {
      if (String(url).startsWith('/api/goals')) return { success: true, data: { items: [] } }
      return { success: true, data: { id: 'new', title: 'x' } }
    })
  })

  it('shows chips for parsed tokens and submits a task with the parsed fields', async () => {
    const onClose = vi.fn()
    wrap(<QuickCaptureModal open onClose={onClose} />)
    const input = await screen.findByTestId('capture-input')
    await userEvent.type(input, 'Call bank tomorrow #finance !high')
    expect(screen.getByTestId('capture-chip-date')).toHaveTextContent(/tomorrow/i)
    expect(screen.getByTestId('capture-chip-tag-finance')).toBeInTheDocument()
    expect(screen.getByTestId('capture-chip-priority')).toHaveTextContent(/high/i)
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    const taskCall = apiClient.mock.calls.find((c) => c[0] === '/api/tasks')
    expect(taskCall).toBeTruthy()
    const body = JSON.parse((taskCall![1] as { body: string }).body)
    expect(body).toMatchObject({
      title: 'Call bank',
      plannedDate: '2026-10-17',
      tags: ['finance'],
      priority: 'high',
    })
  })

  it('creates a note when the note prefix is used', async () => {
    wrap(<QuickCaptureModal open onClose={() => {}} />)
    await userEvent.type(await screen.findByTestId('capture-input'), 'note: onboarding idea{enter}')
    await waitFor(() => expect(apiClient.mock.calls.some((c) => c[0] === '/api/notes')).toBe(true))
    expect(screen.queryByTestId('capture-chip-date')).toBeNull()
  })

  it('saves raw text to the Inbox on Shift+Enter and shows the Inbox chip for the prefix', async () => {
    const onClose = vi.fn()
    wrap(<QuickCaptureModal open onClose={onClose} />)
    const input = await screen.findByTestId('capture-input')
    await userEvent.type(input, 'half an idea tomorrow #maybe')
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}')
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    const inboxCall = apiClient.mock.calls.find((c) => c[0] === '/api/inbox')
    expect(inboxCall).toBeTruthy()
    const body = JSON.parse((inboxCall![1] as { body: string }).body)
    expect(body.content).toBe('half an idea tomorrow #maybe')
    expect(body.clientRequestId).toMatch(/^[0-9a-f-]{36}$/)
    expect(apiClient.mock.calls.some((c) => c[0] === '/api/tasks')).toBe(false)
  })

  it('switches to the Inbox destination with the inbox prefix', async () => {
    wrap(<QuickCaptureModal open onClose={() => {}} />)
    await userEvent.type(await screen.findByTestId('capture-input'), 'inbox: loose thought')
    expect(screen.getByTestId('capture-chip-kind')).toHaveTextContent(/inbox/i)
  })
})
