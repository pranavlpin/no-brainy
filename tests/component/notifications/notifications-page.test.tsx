import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
const markRead = vi.fn()
vi.mock('@/hooks/use-notifications', () => ({
  useNotifications: () => ({
    data: {
      items: [
        {
          id: 'n1',
          userId: 'u1',
          type: 'overdue',
          title: 'Overdue',
          body: 'Call the bank',
          relatedEntity: 'task',
          relatedId: 't1',
          isRead: false,
          readAt: null,
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
    },
    isLoading: false,
  }),
  useMarkRead: () => ({ mutate: markRead, isPending: false }),
  useMarkAllRead: () => ({ mutate: vi.fn(), isPending: false }),
  useGenerateNotifications: () => ({ mutate: vi.fn(), isPending: false }),
  useUnreadCount: () => ({ data: 1 }),
}))

import NotificationsPage from '@/app/(dashboard)/notifications/page'

describe('Notifications page list items', () => {
  beforeEach(() => {
    push.mockReset()
    markRead.mockReset()
  })

  it('never nests a button inside a button', () => {
    const { container } = render(<NotificationsPage />)
    expect(container.querySelector('button button')).toBeNull()
  })

  it('opening a row marks it read and navigates; Mark read only marks it read', async () => {
    render(<NotificationsPage />)
    await userEvent.click(screen.getByRole('button', { name: /mark read/i }))
    expect(markRead).toHaveBeenCalledWith('n1')
    expect(push).not.toHaveBeenCalled()
    await userEvent.click(screen.getByText('Call the bank').closest('button') as HTMLElement)
    expect(markRead).toHaveBeenCalledTimes(2)
    expect(push).toHaveBeenCalledWith('/tasks')
  })
})
