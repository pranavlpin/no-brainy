/**
 * Date helpers that honor the user's timezone.
 *
 * Vocabulary:
 * - A "date key" is a calendar day as `YYYY-MM-DD`.
 * - `@db.Date` columns (dueDate, planDate, reviewDate) store UTC midnight for
 *   a key; use `dateFromKey` / `dayBoundsUtc` for them.
 * - Timestamp columns (createdAt, completedAt, startedAt) need the real
 *   instants where the user's local day starts and ends; use `localDayBounds`.
 *
 * Never compute "today" with `toISOString().slice(0, 10)` or `Date.UTC(...)`
 * in product code; go through `todayKey(userTimezone(user))`.
 */

export const DEFAULT_TIMEZONE = 'Asia/Kolkata'

const KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/

function isKnownTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** Resolve the zone to use for a user; empty or UTC falls back to the owner's zone. */
export function userTimezone(user: { timezone?: string | null } | null | undefined): string {
  const tz = user?.timezone?.trim()
  if (!tz || tz === 'UTC' || !isKnownTimezone(tz)) return DEFAULT_TIMEZONE
  return tz
}

/** The browser's zone, or the default when unavailable (SSR). */
export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE
  } catch {
    return DEFAULT_TIMEZONE
  }
}

interface Parts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

function partsIn(date: Date, tz: string): Parts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const out: Partial<Parts> = {}
  for (const p of fmt.formatToParts(date)) {
    if (p.type === 'literal') continue
    out[p.type as keyof Parts] = Number(p.value)
  }
  return out as Parts
}

/** Calendar day of an instant, in the given zone. */
export function dateKeyFromDate(date: Date, tz: string): string {
  const { year, month, day } = partsIn(date, tz)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Today's date key in the given zone. */
export function todayKey(tz: string, now: Date = new Date()): string {
  return dateKeyFromDate(now, tz)
}

/** Hour of the day (0 to 23) in the given zone. */
export function localHour(tz: string, now: Date = new Date()): number {
  return partsIn(now, tz).hour
}

/** True for a real `YYYY-MM-DD` calendar day. */
export function isValidDateKey(key: string): boolean {
  const m = KEY_RE.exec(key)
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(Date.UTC(y, mo - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d
}

/** UTC-midnight `Date` for a key; the value `@db.Date` columns store. */
export function dateFromKey(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`)
}

/** Key for a UTC-midnight `Date` read from a `@db.Date` column. */
export function keyFromDbDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Add (or subtract) whole days to a key. */
export function addDays(key: string, days: number): string {
  const d = dateFromKey(key)
  d.setUTCDate(d.getUTCDate() + days)
  return keyFromDbDate(d)
}

/** `[start, end)` as UTC-midnight dates, for `@db.Date` comparisons. */
export function dayBoundsUtc(key: string): { start: Date; end: Date } {
  return { start: dateFromKey(key), end: dateFromKey(addDays(key, 1)) }
}

/** The instant at which local midnight of `key` occurs in `tz`. */
export function zonedMidnightUtc(key: string, tz: string): Date {
  const guess = dateFromKey(key)
  const p = partsIn(guess, tz)
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  const offsetMs = asIfUtc - guess.getTime()
  return new Date(guess.getTime() - offsetMs)
}

/** `[start, end)` real instants for the user's local day, for timestamp columns. */
export function localDayBounds(key: string, tz: string): { start: Date; end: Date } {
  return { start: zonedMidnightUtc(key, tz), end: zonedMidnightUtc(addDays(key, 1), tz) }
}

/** Monday-start week containing `key`. */
export function weekBounds(key: string): { start: string; end: string } {
  const d = dateFromKey(key)
  const dow = d.getUTCDay() || 7 // Monday=1 … Sunday=7
  const start = addDays(key, -(dow - 1))
  return { start, end: addDays(start, 6) }
}

/** ISO week label, e.g. `2026-W42`, for a key. */
export function isoWeekOf(key: string): string {
  const d = dateFromKey(key)
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

/** Monday key for an ISO week label. */
export function weekStartKey(isoWeek: string): string {
  const [yearStr, weekStr] = isoWeek.split('-W')
  const year = Number(yearStr)
  const week = Number(weekStr)
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7
  const week1Monday = new Date(jan4)
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1))
  week1Monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7)
  return keyFromDbDate(week1Monday)
}

/** Format a key for display without shifting the day. */
export function formatDateKey(
  key: string,
  options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' },
  locale = 'en-IN'
): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(dateFromKey(key))
}

/** Human label for a key relative to today: Today, Tomorrow, Yesterday, or a short date. */
export function relativeDayLabel(key: string, today: string): string {
  if (key === today) return 'Today'
  if (key === addDays(today, 1)) return 'Tomorrow'
  if (key === addDays(today, -1)) return 'Yesterday'
  return formatDateKey(key)
}
