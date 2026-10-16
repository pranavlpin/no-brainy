import { expect, it } from 'vitest'
import { addCalendarDays, todayInTimezone } from '@/lib/dates/calendar'

it('uses saved timezone on both sides of India midnight', () => {
  expect(todayInTimezone('Asia/Kolkata', new Date('2026-10-16T18:29:59Z'))).toBe('2026-10-16')
  expect(todayInTimezone('Asia/Kolkata', new Date('2026-10-16T18:30:00Z'))).toBe('2026-10-17')
})
it('keeps calendar days stable across daylight-saving transitions', () => {
  expect(todayInTimezone('America/New_York', new Date('2026-03-08T04:59:59Z'))).toBe('2026-03-07')
  expect(todayInTimezone('America/New_York', new Date('2026-03-08T07:00:00Z'))).toBe('2026-03-08')
  expect(addCalendarDays('2026-03-08', 1)).toBe('2026-03-09')
})
