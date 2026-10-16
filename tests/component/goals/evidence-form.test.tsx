import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EvidenceForm } from '@/components/growth/evidence-form'

const save = vi.hoisted(() => vi.fn())
vi.mock('@/hooks/use-growth', () => ({
  useSaveEvidence: () => ({ mutateAsync: save, isPending: false }),
  useGrowthSources: () => ({ data: { items: [], hasMore: false, page: 1 }, isLoading: false, isError: false, refetch: vi.fn() }),
}))

describe('EvidenceForm', () => {
  it('requires a summary and submits the kind, date, and measurement', async () => {
    const onSaved = vi.fn()
    save.mockResolvedValue({ id: 'e1' })
    render(<EvidenceForm goalId="g1" today="2026-10-16" initialKind="practice" onSaved={onSaved} />)
    const submit = screen.getByRole('button', { name: /save evidence/i })
    expect(submit).toBeDisabled()
    await userEvent.type(screen.getByLabelText(/what did you observe/i), 'Ran 5k without stopping')
    const date = screen.getByLabelText(/date/i)
    await userEvent.clear(date)
    await userEvent.type(date, '2026-10-15')
    await userEvent.type(screen.getByLabelText(/measurement/i), '180')
    expect(submit).toBeEnabled()
    await userEvent.click(submit)
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          goalId: 'g1',
          kind: 'practice',
          observedAt: '2026-10-15',
          measurement: 180,
          summary: 'Ran 5k without stopping',
          clientRequestId: expect.stringMatching(/^[0-9a-f-]{36}$/),
        })
      )
    )
    expect(onSaved).toHaveBeenCalled()
  })
})
