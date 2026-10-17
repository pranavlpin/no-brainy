'use client'

import Link from 'next/link'
import { CalendarCheck, Flame, Moon, Sunrise } from 'lucide-react'
import { AnimatedNumber } from '@/components/motion/animated-number'
import { greetingFor, type DayPhase } from '@/lib/home/phase'
import { formatDateKey } from '@/lib/dates'
import { cn } from '@/lib/utils'

interface HeroProps {
  name: string | null
  hour: number
  today: string
  phase: DayPhase
  streak: number
  overdueCount: number
  /** Shown on weekends until the week's adjustment is saved. */
  week?: { weekStart: string; adjusted: boolean; isWeekend: boolean }
}

const PHASE_COPY: Record<DayPhase, string> = {
  morning: 'Choose what matters, then start.',
  day: 'Head down. The plan is set.',
  evening: 'Wrap up, reflect, and hand tomorrow its first move.',
  closed: 'Day closed. Rest is part of the plan.',
}

/** Greeting, date, streak, and the one contextual action for this phase. */
export function Hero({ name, hour, today, phase, streak, overdueCount, week }: HeroProps) {
  const adjustWeek = !!week && week.isWeekend && !week.adjusted
  const firstName = name?.split(' ')[0] ?? null
  const greeting = greetingFor(hour)

  return (
    <section
      data-testid="home-hero"
      className="surface-glass relative overflow-hidden rounded-3xl px-6 py-6 sm:px-8 sm:py-8"
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl',
          phase === 'evening' || phase === 'closed' ? 'bg-retro-blue/25' : 'bg-retro-yellow/35'
        )}
      />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-retro-dark/50">
            {formatDateKey(today, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-retro-dark sm:text-4xl">
            {greeting}
            {firstName ? `, ${firstName}` : ''}
            <span className="text-retro-pink">.</span>
          </h1>
          <p className="mt-2 text-sm text-retro-dark/70">{PHASE_COPY[phase]}</p>
        </div>

        <div className="flex items-center gap-3">
          {overdueCount > 0 && (
            <Link
              href="/tasks"
              className="flex items-center gap-2 rounded-full border border-retro-pink/40 bg-retro-pink/10 px-3 py-1.5 font-mono text-xs font-bold text-retro-dark transition-colors hover:bg-retro-pink/20"
              data-testid="home-overdue"
            >
              <AnimatedNumber value={overdueCount} /> overdue
            </Link>
          )}
          <div
            className="flex items-center gap-2 rounded-full border border-retro-yellow/60 bg-retro-yellow/20 px-3 py-1.5 font-mono text-xs font-bold text-retro-dark"
            title="Consecutive days with a closed review"
            data-testid="home-streak"
          >
            <Flame
              className={cn('h-4 w-4', streak > 0 ? 'text-retro-orange' : 'text-retro-dark/30')}
            />
            <AnimatedNumber value={streak} /> day streak
          </div>
          {adjustWeek && (
            <Link
              href={`/reviews/weekly?week=${week.weekStart}`}
              data-testid="home-adjust-week"
              className="flex items-center gap-2 rounded-full border border-retro-mint/60 bg-retro-mint/15 px-3 py-1.5 font-mono text-xs font-bold text-retro-dark transition-colors hover:bg-retro-mint/30"
            >
              <CalendarCheck className="h-4 w-4" />
              Adjust the week
            </Link>
          )}
          {phase === 'evening' ? (
            <Link
              href="/reviews/daily"
              data-testid="home-close-day"
              className="flex items-center gap-2 border-2 border-retro-dark bg-retro-blue px-4 py-2 font-mono text-sm font-bold text-white shadow-hard hover-shadow-grow"
            >
              <Moon className="h-4 w-4" />
              Close the day
            </Link>
          ) : phase === 'morning' ? (
            <Link
              href="/planner"
              data-testid="home-plan-day"
              className="flex items-center gap-2 border-2 border-retro-dark bg-retro-yellow px-4 py-2 font-mono text-sm font-bold text-retro-dark shadow-hard hover-shadow-grow"
            >
              <Sunrise className="h-4 w-4" />
              Plan the day
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
