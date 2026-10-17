import { describe, expect, it } from 'vitest'
import { growthProgress, outcomePercent, practiceDays } from '@/lib/growth/progress'

describe('outcomePercent', () => {
  it('is null without a baseline, target, or measurement, and never for financial goals', () => {
    expect(outcomePercent({ baseline: 0, target: 10 }, null)).toBeNull()
    expect(outcomePercent({ baseline: null, target: 10 }, 5)).toBeNull()
    expect(outcomePercent({ baseline: 0, target: null }, 5)).toBeNull()
    expect(outcomePercent({ baseline: 5, target: 5 }, 5)).toBeNull()
    expect(outcomePercent({ category: 'financial', baseline: 0, target: 10 }, 5)).toBeNull()
  })

  it('measures distance from baseline to target in either direction and clamps to 0..100', () => {
    expect(outcomePercent({ baseline: 200, target: 160 }, 180)).toBe(50)
    expect(outcomePercent({ baseline: 0, target: 10 }, 12)).toBe(100)
    expect(outcomePercent({ baseline: 0, target: 10 }, -3)).toBe(0)
  })

  it('keeps task completion separate from the measured outcome', () => {
    expect(growthProgress({ taskCount: 3, completedTaskCount: 3, baseline: 0, target: 10 }, null)).toEqual({
      taskPercent: 100,
      outcomePercent: null,
      measurement: null,
    })
  })
})

describe('practiceDays', () => {
  it('counts distinct local days across practice evidence and productive sessions in the week', () => {
    const count = practiceDays({
      weekStart: '2026-10-12',
      timezone: 'Asia/Kolkata',
      sessions: [
        { endedAt: '2026-10-12T19:00:00Z', outcome: 'completed' }, // 13 Oct IST
        { endedAt: '2026-10-13T05:00:00Z', outcome: 'progress' }, // 13 Oct IST, same day
        { endedAt: '2026-10-14T05:00:00Z', outcome: 'blocked' }, // not practice
        { endedAt: '2026-10-19T05:00:00Z', outcome: 'completed' }, // next week
        { endedAt: null, outcome: null },
      ],
      evidence: [
        { observedAt: '2026-10-13', kind: 'practice' }, // same day as the sessions
        { observedAt: '2026-10-15', kind: 'practice' },
        { observedAt: '2026-10-16', kind: 'rest' },
        { observedAt: '2026-10-11', kind: 'practice' }, // last week
      ],
    })
    expect(count).toBe(2)
  })
})
