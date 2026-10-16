'use client'

import { useEffect, useState } from 'react'
import { browserTimezone, todayKey, zonedMidnightUtc, addDays } from '@/lib/dates'

/**
 * Today's date key in the browser's timezone, refreshed when local midnight
 * passes so long-lived tabs roll over correctly.
 */
export function useUserToday(): { today: string; timezone: string } {
  const [timezone] = useState(() => browserTimezone())
  const [today, setToday] = useState(() => todayKey(timezone))

  useEffect(() => {
    const nextMidnight = zonedMidnightUtc(addDays(today, 1), timezone).getTime()
    const delay = Math.max(1000, nextMidnight - Date.now() + 500)
    const timer = setTimeout(() => setToday(todayKey(timezone)), delay)
    return () => clearTimeout(timer)
  }, [today, timezone])

  return { today, timezone }
}
