import { fireEvent, render, screen } from '@testing-library/react'
import { it, expect, vi } from 'vitest'
import { CoachChat } from '@/components/ai/coach-chat'
vi.mock('@/lib/ai/stream-client', () => ({
  streamAIResponse: async function* () {
    yield 'One '
    yield 'small experiment.'
  },
}))
vi.mock('@/components/ai/chat-message', () => ({
  ChatMessage: ({ message }: { message: { content: string } }) => <p>{message.content}</p>,
}))
vi.mock('@/components/ai/chat-input', () => ({ ChatInput: () => null }))
it('announces completion once while keeping streamed content outside live regions', async () => {
  render(<CoachChat />)
  fireEvent.click(screen.getByRole('button', { name: 'What should I focus on today?' }))
  await screen.findByText('One small experiment.')
  expect(screen.getByRole('status')).toHaveTextContent('Response ready')
  expect(screen.getByText('One small experiment.').closest('[aria-live]')).toBeNull()
})
