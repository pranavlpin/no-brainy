import { expect, it } from 'vitest'
import { elapsedSeconds } from '@/lib/focus/clock'
import { startFocusSchema } from '@/lib/validations/focus'
it('derives active time across suspended tabs and caps an expired session', () => {
  const session = {
    state: 'running',
    activeSince: '2026-10-16T10:00:00Z',
    accumulatedSeconds: 90,
    plannedSeconds: 1500,
  }
  expect(elapsedSeconds(session, Date.parse('2026-10-16T10:05:00Z'))).toBe(390)
  expect(elapsedSeconds(session, Date.parse('2026-10-16T11:00:00Z'))).toBe(1500)
  expect(elapsedSeconds(session, Date.parse('2026-10-16T09:00:00Z'))).toBe(90)
})
it('preserves elapsed work through pause, reload, resume and finish', () => {
  const paused = {
    state: 'paused',
    activeSince: null,
    accumulatedSeconds: 230,
    plannedSeconds: 3000,
  }
  expect(elapsedSeconds(JSON.parse(JSON.stringify(paused)), Date.parse('2026-10-17'))).toBe(230)
  expect(
    elapsedSeconds(
      { ...paused, state: 'running', activeSince: '2026-10-17T00:00:00Z' },
      Date.parse('2026-10-17T00:01:00Z')
    )
  ).toBe(290)
  expect(elapsedSeconds({ ...paused, state: 'finished' })).toBe(230)
})
it('requires whole durations from one minute through three hours', () => {
  const base = { clientRequestId: 'ff1726d9-8a2d-4da0-b702-5dc75a868eff' }
  for (const plannedSeconds of [0, 59, 10801, 90.5])
    expect(startFocusSchema.safeParse({ ...base, plannedSeconds }).success).toBe(false)
  for (const plannedSeconds of [60, 1500, 3000, 10800])
    expect(startFocusSchema.safeParse({ ...base, plannedSeconds }).success).toBe(true)
})
