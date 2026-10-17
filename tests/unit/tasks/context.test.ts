import { describe, expect, it } from 'vitest'
import { matchesContext, filterByContext } from '@/lib/tasks/context'

const items = [
  { id: 'a', context: 'work' as const },
  { id: 'b', context: 'personal' as const },
  { id: 'c', context: null },
]

describe('context filter', () => {
  it('keeps everything for all, and keeps unclassified items in either context', () => {
    expect(filterByContext(items, 'all').map((i) => i.id)).toEqual(['a', 'b', 'c'])
    expect(filterByContext(items, 'work').map((i) => i.id)).toEqual(['a', 'c'])
    expect(filterByContext(items, 'personal').map((i) => i.id)).toEqual(['b', 'c'])
    expect(matchesContext({ context: undefined }, 'work')).toBe(true)
  })
})
