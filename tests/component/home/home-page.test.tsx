import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
}))
vi.mock('@/lib/api-client', () => ({ apiClient: vi.fn(() => new Promise(() => {})) }))

const homeData = vi.fn()
vi.mock('@/hooks/use-home', () => ({
  useHome: () => ({ data: homeData(), isLoading: false, isError: false }),
}))

import HomePage from '@/app/(dashboard)/page'
import type { HomeData } from '@/lib/types/home'

const base: HomeData = {
  today: '2026-10-16',
  timezone: 'Asia/Kolkata',
  hour: 9,
  name: 'Pranav',
  phase: 'morning',
  plan: {
    focusTaskIds: [],
    focusTasks: [],
    plannedTasks: [],
    tasksDueToday: [],
    intentMd: 'Ship Home',
    carryForwardCount: 2,
    capacity: { plannedMinutes: 15, availableMinutes: 180, unknownCount: 0, overBy: 0 },
  },
  review: {
    todayDone: false,
    todayMood: null,
    yesterday: { mood: 'good', tomorrowIntent: 'Ship Home' },
  },
  learn: {
    cardsDue: 12,
    decksDue: [{ id: 'd1', name: 'System Design', dueCount: 12 }],
    reading: [],
  },
  goals: { active: [], staleCount: 0 },
  week: { weekStart: '2026-10-12', adjusted: false, isWeekend: false },
  streak: 3,
  overdueCount: 1,
  focusMinutesToday: null,
}

function renderHome(data: HomeData) {
  homeData.mockReturnValue(data)
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <HomePage />
    </QueryClientProvider>
  )
}

describe('HomePage (Today cockpit)', () => {
  beforeEach(() => homeData.mockReset())

  it('renders the hero, intent, focus, learn, and goals sections in the morning with a plan-the-day call', () => {
    renderHome(base)
    expect(screen.getByTestId('home-hero')).toHaveTextContent('Good morning')
    expect(screen.getByTestId('home-hero')).toHaveTextContent('Pranav')
    expect(screen.getByTestId('home-intent')).toHaveTextContent('Ship Home')
    expect(screen.getByTestId('home-focus')).toBeInTheDocument()
    expect(screen.getByTestId('home-learn')).toHaveTextContent('12')
    expect(screen.getByTestId('home-goals')).toBeInTheDocument()
    expect(screen.getByTestId('home-plan-day')).toBeInTheDocument()
    expect(screen.queryByTestId('home-close-day')).toBeNull()
  })

  it('raises the close-the-day call in the evening', () => {
    renderHome({ ...base, hour: 20, phase: 'evening' })
    expect(screen.getByTestId('home-close-day')).toBeInTheDocument()
    expect(screen.getByTestId('home-hero')).toHaveTextContent('Good evening')
  })

  it('shows the review summary once the day is closed', () => {
    renderHome({
      ...base,
      hour: 22,
      phase: 'closed',
      review: { todayDone: true, todayMood: 'great', yesterday: null },
    })
    expect(screen.getByTestId('home-day-closed')).toBeInTheDocument()
  })
})

describe('routes', () => {
  it('keeps the marketing page at /welcome and the Today page at the dashboard root', () => {
    const root = path.resolve(__dirname, '../../../src/app')
    expect(existsSync(path.join(root, 'welcome/page.tsx'))).toBe(true)
    expect(existsSync(path.join(root, 'page.tsx'))).toBe(false)
    expect(existsSync(path.join(root, '(dashboard)/page.tsx'))).toBe(true)
  })
})
