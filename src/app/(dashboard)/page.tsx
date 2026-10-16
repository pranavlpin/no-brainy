'use client'

import Link from 'next/link'
import { Moon, Sparkles } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StaggerBlock, StaggerGroup } from '@/components/motion'
import { Hero } from '@/components/home/hero'
import { FocusCard } from '@/components/home/focus-card'
import { LearnCard } from '@/components/home/learn-card'
import { GoalsPulse } from '@/components/home/goals-pulse'
import { CaptureInline } from '@/components/home/capture-inline'
import { IntentCard } from '@/components/planner/intent-card'
import { getMoodEmoji, getMoodLabel } from '@/components/reviews/mood-selector'
import { useHome } from '@/hooks/use-home'
import { useUpdatePlan } from '@/hooks/use-planner'

function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4" data-testid="home-loading">
      <Skeleton className="h-36 w-full rounded-3xl" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl lg:col-span-2" />
      </div>
    </div>
  )
}

export default function TodayPage() {
  const { data, isLoading, isError } = useHome()
  const updatePlan = useUpdatePlan()

  if (isLoading || !data) {
    if (isError) {
      return (
        <Card className="mx-auto max-w-lg text-center" data-testid="home-error">
          <p className="font-display text-lg font-semibold text-retro-dark">Today could not load</p>
          <p className="mt-1 text-sm text-muted-foreground">Try again in a moment.</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </Card>
      )
    }
    return <HomeSkeleton />
  }

  const closed = data.phase === 'closed'

  return (
    <StaggerGroup className="mx-auto max-w-6xl space-y-4">
      <StaggerBlock>
        <Hero
          name={data.name}
          hour={data.hour}
          today={data.today}
          phase={data.phase}
          streak={data.streak}
          overdueCount={data.overdueCount}
        />
      </StaggerBlock>

      {closed && (
        <StaggerBlock>
          <Card
            data-testid="home-day-closed"
            className="flex flex-wrap items-center gap-4 border-retro-mint/40"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-retro-mint/20 text-2xl">
              {getMoodEmoji(data.review.todayMood) || <Moon className="h-5 w-5 text-retro-mint" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-semibold text-retro-dark">
                Today is closed
                {data.review.todayMood
                  ? ` · felt ${getMoodLabel(data.review.todayMood).toLowerCase()}`
                  : ''}
                .
              </p>
              <p className="text-sm text-muted-foreground">
                {data.streak > 0
                  ? `${data.streak} day${data.streak === 1 ? '' : 's'} in a row. Tomorrow's intent is waiting on the planner.`
                  : 'Tomorrow starts with the intent you set tonight.'}
              </p>
            </div>
            <Link
              href="/reviews/daily"
              className="font-mono text-xs text-retro-blue hover:underline"
            >
              Edit review →
            </Link>
          </Card>
        </StaggerBlock>
      )}

      <StaggerBlock>
        <div data-testid="home-intent">
          <IntentCard
            intent={data.plan.intentMd}
            sourceLabel={
              data.review.yesterday?.tomorrowIntent === data.plan.intentMd
                ? 'Set last night while closing the day'
                : undefined
            }
            onSave={(intent) => updatePlan.mutate({ intentMd: intent || null })}
          />
        </div>
      </StaggerBlock>

      <StaggerBlock>
        <CaptureInline today={data.today} />
      </StaggerBlock>

      <div className="grid gap-4 lg:grid-cols-3">
        <StaggerBlock className="lg:col-span-2">
          <FocusCard
            focusTasks={data.plan.focusTasks}
            dueToday={data.plan.tasksDueToday}
            goals={data.goals.active}
            carryForwardCount={data.plan.carryForwardCount}
          />
        </StaggerBlock>
        <StaggerBlock>
          <LearnCard learn={data.learn} />
        </StaggerBlock>
        <StaggerBlock className="lg:col-span-2">
          <GoalsPulse goals={data.goals.active} staleCount={data.goals.staleCount} />
        </StaggerBlock>
        <StaggerBlock>
          <Card className="flex h-full flex-col justify-between border-retro-blue/30">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-retro-dark/50">
                Shortcuts
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-retro-dark/80">
                <li className="flex items-center justify-between">
                  <span>Command palette</span>
                  <kbd className="rounded border border-retro-dark/20 bg-background/70 px-1.5 py-0.5 font-mono text-[10px]">
                    ⌘K
                  </kbd>
                </li>
                <li className="flex items-center justify-between">
                  <span>Quick capture</span>
                  <kbd className="rounded border border-retro-dark/20 bg-background/70 px-1.5 py-0.5 font-mono text-[10px]">
                    C
                  </kbd>
                </li>
                <li className="flex items-center justify-between">
                  <span>Planner</span>
                  <Link
                    href="/planner"
                    className="font-mono text-xs text-retro-blue hover:underline"
                  >
                    open →
                  </Link>
                </li>
                <li className="flex items-center justify-between">
                  <span>AI coach</span>
                  <Link href="/ai" className="font-mono text-xs text-retro-blue hover:underline">
                    ask →
                  </Link>
                </li>
              </ul>
            </div>
            <Link
              href="/insights"
              className="mt-4 flex items-center gap-2 text-xs text-retro-dark/60 hover:text-retro-blue"
            >
              <Sparkles className="h-3.5 w-3.5" /> See this week&apos;s insights
            </Link>
          </Card>
        </StaggerBlock>
      </div>
    </StaggerGroup>
  )
}
