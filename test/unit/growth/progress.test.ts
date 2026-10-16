import { expect, it } from 'vitest'
import { growthProgress, practiceCount } from '@/lib/growth/progress'
it('never infers an outcome measurement from completed tasks', () => {
  expect(
    growthProgress({ taskCount: 3, completedTaskCount: 3, baseline: 0, target: 10 }, null)
  ).toEqual({ taskPercent: 100, outcomePercent: null, measurement: null })
  expect(
    growthProgress({ taskCount: 5, completedTaskCount: 1, baseline: 200, target: 160 }, 180)
  ).toEqual({ taskPercent: 20, outcomePercent: 50, measurement: 180 })
  expect(
    growthProgress({ category: 'financial', baseline: 0, target: 10 }, 5).outcomePercent
  ).toBeNull()
})
it('deduplicates a routine occurrence, its sessions and explicit evidence in the account-local week', () => {
  const task = {
    id: 'task',
    routineId: 'routine',
    occurrenceDate: '2026-10-12',
    completedAt: '2026-10-11T19:00:00Z',
    status: 'completed',
  }
  const sessions = [
    { id: 'one', completedAt: '2026-10-11T19:00:00Z', outcome: 'completed', task },
    { id: 'two', completedAt: '2026-10-12T12:00:00Z', outcome: 'progress', task },
    { id: 'outside', completedAt: '2026-10-18T19:00:00Z', outcome: 'progress', task: null },
  ]
  const evidence = [
    {
      id: 'evidence',
      observedAt: '2026-10-12',
      kind: 'practice',
      practiceKey: 'routine:routine:2026-10-12',
    },
    { id: 'rest', observedAt: '2026-10-13', kind: 'rest', practiceKey: null },
  ]
  expect(
    practiceCount({
      weekStart: '2026-10-12',
      timezone: 'Asia/Kolkata',
      tasks: [task],
      sessions,
      evidence,
    })
  ).toBe(1)
  expect(
    practiceCount({
      weekStart: '2026-10-12',
      timezone: 'UTC',
      tasks: [],
      sessions: [sessions[2]],
      evidence: [],
    })
  ).toBe(1)
})
