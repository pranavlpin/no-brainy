import { addCalendarDays, calendarDate, todayInTimezone } from '@/lib/dates/calendar'

function firstInstantOfDate(date: string, timezone: string): Date {
  const center = new Date(`${date}T00:00:00Z`).getTime()
  let low = center - 36 * 60 * 60 * 1000
  let high = center + 36 * 60 * 60 * 1000
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (todayInTimezone(timezone, new Date(middle)) < date) low = middle + 1
    else high = middle
  }
  return new Date(low)
}
/** Return exact half-open instants for calendar days in an IANA zone, including daylight-saving transitions. */
export function calendarWindow(date: string, timezone: string, days = 1) {
  if (calendarDate(date) !== date || !Number.isInteger(days) || days < 1 || days > 366)
    throw new RangeError('Invalid calendar window')
  return {
    start: firstInstantOfDate(date, timezone),
    end: firstInstantOfDate(addCalendarDays(date, days), timezone),
  }
}
