import { describe, expect, it } from 'vitest'
import { dayPhase, greetingFor } from '@/lib/home/phase'
import { computeReviewStreak } from '@/lib/home/streak'

describe('greetingFor', () => {
  it('maps hours to greetings', () => {
    expect(greetingFor(6)).toBe('Good morning')
    expect(greetingFor(11)).toBe('Good morning')
    expect(greetingFor(13)).toBe('Good afternoon')
    expect(greetingFor(18)).toBe('Good evening')
    expect(greetingFor(23)).toBe('Up late')
    expect(greetingFor(3)).toBe('Up late')
  })
})

describe('dayPhase', () => {
  it('is morning until focus is chosen, day while working, evening after 18:00 or when focus is done', () => {
    expect(dayPhase({ hour: 8, hasFocus: false, focusDone: false, reviewDone: false })).toBe(
      'morning'
    )
    expect(dayPhase({ hour: 10, hasFocus: true, focusDone: false, reviewDone: false })).toBe('day')
    expect(dayPhase({ hour: 19, hasFocus: true, focusDone: false, reviewDone: false })).toBe(
      'evening'
    )
    expect(dayPhase({ hour: 14, hasFocus: true, focusDone: true, reviewDone: false })).toBe(
      'evening'
    )
    expect(dayPhase({ hour: 21, hasFocus: true, focusDone: true, reviewDone: true })).toBe('closed')
    expect(dayPhase({ hour: 20, hasFocus: false, focusDone: false, reviewDone: false })).toBe(
      'evening'
    )
  })
})

describe('computeReviewStreak', () => {
  it('counts consecutive reviewed days ending today or yesterday', () => {
    expect(computeReviewStreak(['2026-10-16', '2026-10-15', '2026-10-14'], '2026-10-16')).toBe(3)
    expect(computeReviewStreak(['2026-10-15', '2026-10-14'], '2026-10-16')).toBe(2)
    expect(computeReviewStreak(['2026-10-13', '2026-10-12'], '2026-10-16')).toBe(0)
    expect(computeReviewStreak(['2026-10-16', '2026-10-14'], '2026-10-16')).toBe(1)
    expect(computeReviewStreak([], '2026-10-16')).toBe(0)
  })
})
