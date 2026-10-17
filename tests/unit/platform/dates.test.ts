import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TIMEZONE,
  addDays,
  dateFromKey,
  dateKeyFromDate,
  dayBoundsUtc,
  formatDateKey,
  isValidDateKey,
  isoWeekOf,
  localDayBounds,
  localHour,
  todayKey,
  userTimezone,
  weekBounds,
  weekStartKey,
} from '@/lib/dates'

describe('dates: user timezone', () => {
  it('falls back to Asia/Kolkata for empty or UTC zones', () => {
    expect(DEFAULT_TIMEZONE).toBe('Asia/Kolkata')
    expect(userTimezone({ timezone: 'UTC' })).toBe('Asia/Kolkata')
    expect(userTimezone({ timezone: '' })).toBe('Asia/Kolkata')
    expect(userTimezone({ timezone: null })).toBe('Asia/Kolkata')
    expect(userTimezone({})).toBe('Asia/Kolkata')
  })

  it('keeps a valid zone and rejects garbage', () => {
    expect(userTimezone({ timezone: 'Europe/London' })).toBe('Europe/London')
    expect(userTimezone({ timezone: 'Not/AZone' })).toBe('Asia/Kolkata')
  })
})

describe('dates: today and keys', () => {
  const lateEveningUtc = new Date('2026-10-16T23:00:00Z')

  it('computes today in the given zone', () => {
    expect(todayKey('Asia/Kolkata', lateEveningUtc)).toBe('2026-10-17')
    expect(todayKey('UTC', lateEveningUtc)).toBe('2026-10-16')
    expect(todayKey('America/Los_Angeles', lateEveningUtc)).toBe('2026-10-16')
  })

  it('formats any instant to a date key in a zone', () => {
    expect(dateKeyFromDate(new Date('2026-01-01T00:30:00Z'), 'Asia/Kolkata')).toBe('2026-01-01')
    expect(dateKeyFromDate(new Date('2025-12-31T19:30:00Z'), 'Asia/Kolkata')).toBe('2026-01-01')
  })

  it('validates keys strictly', () => {
    expect(isValidDateKey('2026-10-16')).toBe(true)
    expect(isValidDateKey('2026-02-30')).toBe(false)
    expect(isValidDateKey('16-10-2026')).toBe(false)
    expect(isValidDateKey('')).toBe(false)
  })

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDays('2026-10-16', 0)).toBe('2026-10-16')
  })

  it('maps keys to UTC-midnight dates for @db.Date columns', () => {
    expect(dateFromKey('2026-10-17').toISOString()).toBe('2026-10-17T00:00:00.000Z')
    const b = dayBoundsUtc('2026-10-17')
    expect(b.start.toISOString()).toBe('2026-10-17T00:00:00.000Z')
    expect(b.end.toISOString()).toBe('2026-10-18T00:00:00.000Z')
  })

  it('computes real instants for a local day in a zone', () => {
    const b = localDayBounds('2026-10-17', 'Asia/Kolkata')
    expect(b.start.toISOString()).toBe('2026-10-16T18:30:00.000Z')
    expect(b.end.toISOString()).toBe('2026-10-17T18:30:00.000Z')
  })

  it('returns the local hour', () => {
    expect(localHour('Asia/Kolkata', new Date('2026-10-16T15:00:00Z'))).toBe(20)
    expect(localHour('UTC', new Date('2026-10-16T15:00:00Z'))).toBe(15)
  })
})

describe('dates: weeks and formatting', () => {
  it('finds Monday-start week bounds', () => {
    expect(weekBounds('2026-10-16')).toEqual({ start: '2026-10-12', end: '2026-10-18' })
    expect(weekBounds('2026-10-12')).toEqual({ start: '2026-10-12', end: '2026-10-18' })
    expect(weekBounds('2026-10-18')).toEqual({ start: '2026-10-12', end: '2026-10-18' })
  })

  it('round-trips ISO weeks', () => {
    expect(isoWeekOf('2026-10-16')).toBe('2026-W42')
    expect(weekStartKey('2026-W42')).toBe('2026-10-12')
    expect(isoWeekOf('2027-01-01')).toBe('2026-W53')
  })

  it('formats without shifting the day', () => {
    expect(formatDateKey('2026-10-17', { weekday: 'long', month: 'long', day: 'numeric' })).toBe(
      'Saturday, 17 October'
    )
  })
})
