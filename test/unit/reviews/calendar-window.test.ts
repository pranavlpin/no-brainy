import { expect, it } from 'vitest'
import { calendarWindow } from '@/lib/reviews/calendar-window'
it('uses Kolkata midnight rather than UTC boundaries', () => {
  const range = calendarWindow('2026-10-16', 'Asia/Kolkata')
  expect(range.start.toISOString()).toBe('2026-10-15T18:30:00.000Z')
  expect(range.end.toISOString()).toBe('2026-10-16T18:30:00.000Z')
})
it('allows daylight-saving days and weeks to have their actual duration', () => {
  const spring = calendarWindow('2026-03-08', 'America/New_York')
  expect(spring.end.getTime() - spring.start.getTime()).toBe(23 * 60 * 60 * 1000)
  const autumn = calendarWindow('2026-10-26', 'America/New_York', 7)
  expect(autumn.end.getTime() - autumn.start.getTime()).toBe(169 * 60 * 60 * 1000)
})
