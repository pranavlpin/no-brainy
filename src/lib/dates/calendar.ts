/** Normalize a calendar label (or a legacy ISO timestamp) without shifting its date. */
export function calendarDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value))
    return null
  const label = value.slice(0, 10)
  const date = new Date(`${label}T00:00:00.000Z`)
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== label) return null
  if (value.length > 10 && !Number.isFinite(new Date(value).getTime())) return null
  return label
}

/** Today's calendar key in the account's saved IANA timezone; invalid zones throw. */
export function todayInTimezone(timezone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find((p) => p.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

/** Add calendar days in UTC, independent of the local clock and daylight saving. */
export function addCalendarDays(value: string, days: number): string {
  const label = calendarDate(value)
  if (!label) throw new Error('Invalid calendar date')
  const date = new Date(`${label}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
