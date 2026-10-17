import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/hooks/use-expense-categories', () => ({
  useExpenseCategories: () => ({
    data: [{ id: 'c1', name: 'Food', icon: null, color: null, userId: 'u1' }],
  }),
}))
vi.mock('@/hooks/use-expenses', () => ({
  useBulkCreateExpenses: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

import { ExpenseBulkEntry } from '@/components/expenses/expense-bulk-entry'

function rowIds() {
  const { container, unmount } = render(<ExpenseBulkEntry />)
  const ids = Array.from(container.querySelectorAll('[data-row]')).map((el) =>
    el.getAttribute('data-row')
  )
  unmount()
  return ids
}

describe('ExpenseBulkEntry row ids', () => {
  it('are deterministic so server and client markup agree', () => {
    const first = rowIds()
    const second = rowIds()
    expect(first.length).toBeGreaterThan(0)
    expect(first).toEqual(second)
    expect(first[0]).toMatch(/^row-\d+$/)
  })
})
