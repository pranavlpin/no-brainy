import { expect, it } from 'vitest'
import { nextOccurrence } from '@/lib/tasks/recurrence'

it.each([
  ['FREQ=DAILY', '2026-01-01', '2026-10-16', '2026-10-17'],
  ['FREQ=WEEKLY', '2026-01-05', '2026-01-12', '2026-01-19'],
  ['FREQ=WEEKLY', '2026-01-05', '2026-01-14', '2026-01-19'],
  ['FREQ=MONTHLY', '2026-01-31', '2026-01-31', '2026-02-28'],
  ['FREQ=MONTHLY', '2026-01-31', '2026-02-28', '2026-03-31'],
  ['FREQ=MONTHLY', '2028-01-31', '2028-01-31', '2028-02-29'],
  ['FREQ=MONTHLY', '2026-12-31', '2026-12-31', '2027-01-31'],
])(
  'computes %s from anchor %s after %s without catch-up flooding',
  (rule, anchor, after, expected) => {
    expect(nextOccurrence({ rule, anchor, after })).toBe(expected)
  }
)

it('does not reinterpret unsupported rules or advance paused routines', () => {
  expect(
    nextOccurrence({ rule: 'FREQ=DAILY', anchor: '2026-01-01', after: '2026-10-16', paused: true })
  ).toBeNull()
  expect(
    nextOccurrence({ rule: 'FREQ=WEEKLY;BYDAY=MO,FR', anchor: '2026-01-01', after: '2026-10-16' })
  ).toBeNull()
})
