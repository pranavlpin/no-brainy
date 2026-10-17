import { describe, expect, it } from 'vitest'
import { isMonday, nextWeekStart, weekStartFor } from '@/lib/reviews/weeks'
import { weekStartParamSchema, weeklyReviewSchema } from '@/lib/validations/reviews'

describe('week keys', () => {
  it('finds the Monday for any day and only accepts Mondays as week keys', () => {
    expect(weekStartFor('2026-10-16')).toBe('2026-10-12') // Friday
    expect(weekStartFor('2026-10-12')).toBe('2026-10-12') // Monday
    expect(weekStartFor('2026-10-18')).toBe('2026-10-12') // Sunday
    expect(nextWeekStart('2026-10-12')).toBe('2026-10-19')
    expect(isMonday('2026-10-12')).toBe(true)
    expect(isMonday('2026-10-13')).toBe(false)
    expect(weekStartParamSchema.safeParse('2026-10-12').success).toBe(true)
    expect(weekStartParamSchema.safeParse('2026-10-13').success).toBe(false)
    expect(weekStartParamSchema.safeParse('2026-02-30').success).toBe(false)
  })

  it('keeps at most three outcomes and short answers', () => {
    expect(
      weeklyReviewSchema.safeParse({
        outcomes: [
          { id: 'a', text: 'Ship the planner' },
          { id: 'b', text: 'Run three times' },
          { id: 'c', text: 'Read 50 pages' },
          { id: 'd', text: 'One too many' },
        ],
      }).success
    ).toBe(false)
    expect(
      weeklyReviewSchema.safeParse({ stopDoing: 'Checking email first', outcomes: [] }).success
    ).toBe(true)
  })
})
