'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { HabitLogResponse } from '@/lib/types/goals'

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']

interface HabitCalendarProps {
  logs: HabitLogResponse[]
  weeks?: number
}

function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function HabitCalendar({ logs, weeks = 12 }: HabitCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

  const { grid, completedSet } = useMemo(() => {
    const set = new Set(
      logs.filter((l) => l.completed).map((l) => l.logDate.slice(0, 10))
    )

    const today = new Date()
    const totalDays = weeks * 7
    const cells: Date[] = []

    // Find the start: go back totalDays from today, align to Monday
    const end = new Date(today)
    const start = new Date(today)
    start.setDate(start.getDate() - totalDays + 1)
    // Align start to Monday
    const dayOfWeek = start.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    start.setDate(start.getDate() + mondayOffset)

    const cursor = new Date(start)
    while (cursor <= end) {
      cells.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }

    return { grid: cells, completedSet: set }
  }, [logs, weeks])

  // Group into columns (weeks)
  const columns: Date[][] = []
  for (let i = 0; i < grid.length; i += 7) {
    columns.push(grid.slice(i, i + 7))
  }

  function getCellColor(dateKey: string): string {
    if (completedSet.has(dateKey)) return 'bg-green-500 dark:bg-green-600'
    return 'bg-gray-100 dark:bg-gray-800'
  }

  return (
    <div className="relative">
      <div className="flex gap-[3px]">
        {/* Day labels column */}
        <div className="flex flex-col gap-[3px] pr-1">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="h-3 w-6 text-[10px] text-muted-foreground leading-3">
              {label}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {columns.map((week, ci) => (
          <div key={ci} className="flex flex-col gap-[3px]">
            {week.map((day) => {
              const key = getDateKey(day)
              const isToday = key === getDateKey(new Date())
              return (
                <div
                  key={key}
                  className={cn(
                    'h-3 w-3 rounded-sm transition-colors',
                    getCellColor(key),
                    isToday && 'ring-1 ring-primary ring-offset-1'
                  )}
                  onMouseEnter={() => setHoveredDay(key)}
                  onMouseLeave={() => setHoveredDay(null)}
                  title={`${key} - ${completedSet.has(key) ? 'Completed' : 'Incomplete'}`}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white dark:bg-gray-700 whitespace-nowrap pointer-events-none">
          {hoveredDay} {completedSet.has(hoveredDay) ? '- Completed' : '- Incomplete'}
        </div>
      )}
    </div>
  )
}
