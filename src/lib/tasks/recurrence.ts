import { addCalendarDays, calendarDate } from '@/lib/dates/calendar'

/** Supported rules are deliberately exact; complex legacy RRULEs remain untouched. */
export function supportedRecurrence(rule: string | null | undefined): boolean {
  return rule === 'FREQ=DAILY' || rule === 'FREQ=WEEKLY' || rule === 'FREQ=MONTHLY'
}

/** Return the first anchored calendar occurrence strictly after the cutoff; never build a missed backlog. */
export function nextOccurrence({
  rule,
  anchor,
  after,
  paused = false,
}: {
  rule: string
  anchor: string
  after: string
  paused?: boolean
}): string | null {
  if (paused || !supportedRecurrence(rule) || !calendarDate(anchor) || !calendarDate(after))
    return null
  if (after < anchor) return anchor
  if (rule === 'FREQ=DAILY') return addCalendarDays(after, 1)
  if (rule === 'FREQ=WEEKLY') {
    const difference =
      (Date.parse(`${after}T00:00:00Z`) - Date.parse(`${anchor}T00:00:00Z`)) / 86400000
    return addCalendarDays(anchor, (Math.floor(difference / 7) + 1) * 7)
  }
  const day = Number(anchor.slice(8, 10))
  const cutoff = new Date(`${after}T00:00:00Z`)
  const inMonth = (year: number, month: number) => {
    const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    return new Date(Date.UTC(year, month, Math.min(day, last))).toISOString().slice(0, 10)
  }
  const candidate = inMonth(cutoff.getUTCFullYear(), cutoff.getUTCMonth())
  return candidate > after ? candidate : inMonth(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1)
}
