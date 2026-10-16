import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { CaptureProcessor } from '@/components/inbox/capture-processor'
import type { CaptureResponse } from '@/lib/types/inbox'

const process = vi.hoisted(() => vi.fn())
vi.mock('@/hooks/use-inbox', () => ({ useProcessCapture: () => ({ mutateAsync: process }) }))
vi.mock('@/hooks/use-projects', () => ({
  useProjects: () => ({ data: [{ id: 'project-one', title: 'A useful practice' }] }),
}))
const capture: CaptureResponse = {
  id: 'capture-one',
  userId: 'owner',
  content: 'Practice with intention',
  sourceUrl: 'https://example.com/practice',
  clientRequestId: 'capture-request',
  state: 'inbox',
  destinationId: null,
  destinationType: null,
  processedAt: null,
  createdAt: '2026-10-16T00:00:00Z',
  updatedAt: '2026-10-16T00:00:00Z',
}

it('preserves the original source while explicitly linking an action to a project', async () => {
  const onDone = vi.fn()
  process.mockResolvedValue({
    ...capture,
    state: 'processed',
    destinationId: 'task-one',
    destinationType: 'task',
  })
  render(<CaptureProcessor capture={capture} onDone={onDone} />)
  expect(screen.getByText(capture.content, { selector: 'p' })).toBeVisible()
  expect(screen.getByRole('link', { name: 'Original source' })).toHaveAttribute(
    'href',
    capture.sourceUrl
  )
  fireEvent.change(screen.getByLabelText('Save as'), { target: { value: 'task' } })
  fireEvent.change(screen.getByLabelText('Project'), { target: { value: 'project-one' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save & next' }))
  await waitFor(() =>
    expect(process).toHaveBeenCalledWith(
      expect.objectContaining({ id: capture.id, kind: 'task', projectId: 'project-one' })
    )
  )
  expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ destinationId: 'task-one' }))
})
