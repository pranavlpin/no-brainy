import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CaptureProcessor } from '@/components/inbox/capture-processor'
import type { CaptureResponse } from '@/lib/types/inbox'

const process = vi.hoisted(() => vi.fn())
vi.mock('@/hooks/use-inbox', () => ({
  useProcessCapture: () => ({ mutateAsync: process, isPending: false }),
}))
vi.mock('@/hooks/use-user-today', () => ({
  useUserToday: () => ({ today: '2026-10-16', timezone: 'Asia/Kolkata' }),
}))
vi.mock('@/hooks/use-projects', () => ({ useProjects: () => ({ data: [], isLoading: false }) }))

const capture: CaptureResponse = {
  id: 'c1',
  userId: 'u1',
  clientRequestId: 'r1',
  content: 'Practice with intention every morning\nMore detail on the second line',
  sourceUrl: 'https://example.com/practice',
  state: 'inbox',
  destinationType: null,
  destinationId: null,
  processedAt: null,
  createdAt: '2026-10-16T00:00:00Z',
  updatedAt: '2026-10-16T00:00:00Z',
}

describe('CaptureProcessor', () => {
  it('pre-fills the title from the first line and submits the chosen kind', async () => {
    const onDone = vi.fn()
    process.mockResolvedValue({
      ...capture,
      state: 'processed',
      destinationType: 'task',
      destinationId: 't1',
    })
    render(<CaptureProcessor capture={capture} onDone={onDone} />)
    expect(screen.getByLabelText(/title/i)).toHaveValue('Practice with intention every morning')
    expect(screen.getByRole('link', { name: /source/i })).toHaveAttribute('href', capture.sourceUrl)
    await userEvent.click(screen.getByRole('button', { name: /save & next/i }))
    await waitFor(() =>
      expect(process).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'c1',
          kind: 'task',
          title: 'Practice with intention every morning',
        })
      )
    )
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ destinationId: 't1' }))
  })

  it('asks for a url when saving as a bookmark and pre-fills it from the source', async () => {
    render(<CaptureProcessor capture={capture} onDone={vi.fn()} />)
    await userEvent.click(screen.getByRole('radio', { name: /bookmark/i }))
    expect(screen.getByLabelText(/url/i)).toHaveValue('https://example.com/practice')
  })
})
