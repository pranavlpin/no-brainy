import { addDays, dateFromKey, isValidDateKey, weekBounds } from '@/lib/dates'

/** The Monday of the week containing `key`. */
export function weekStartFor(key: string): string {
  return weekBounds(key).start
}

export function isMonday(key: string): boolean {
  return isValidDateKey(key) && dateFromKey(key).getUTCDay() === 1
}

/** The Monday after the given week's Monday. */
export function nextWeekStart(weekStart: string): string {
  return addDays(weekStart, 7)
}

/** Sunday of the week. */
export function weekEndFor(weekStart: string): string {
  return addDays(weekStart, 6)
}
