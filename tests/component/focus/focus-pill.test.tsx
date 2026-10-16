import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => '/' }))

import { FocusPill } from '@/components/layout/focus-pill'
import { useFocusStore } from '@/stores/focus-store'
import { WORK_SEC } from '@/lib/focus/timer'

describe('FocusPill', () => {
  beforeEach(() => useFocusStore.getState().reset())

  it('renders nothing while idle', () => {
    const { container } = render(<FocusPill />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the countdown and task title while a session runs', () => {
    useFocusStore
      .getState()
      .start(
        {
          kind: 'work',
          plannedSec: WORK_SEC,
          taskId: 't1',
          taskTitle: 'Deep work',
          sessionId: 's1',
        },
        Date.now()
      )
    render(<FocusPill />)
    const pill = screen.getByTestId('focus-pill')
    expect(pill).toHaveTextContent(/2[45]:[0-5]\d/)
    expect(pill).toHaveTextContent('Deep work')
  })
})
