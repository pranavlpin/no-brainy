'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, BookOpen, Leaf, Plus } from 'lucide-react'
import { useGrowth } from '@/hooks/use-growth'
import { useCreateGoal } from '@/hooks/use-goals'
import { useTasks } from '@/hooks/use-tasks'
import { GoalCard } from '@/components/goals/goal-card'
import { GoalForm } from '@/components/goals/goal-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/ui/workspace-states'
import type { GoalStatus } from '@/lib/types/goals'

export default function GrowthHome() {
  const router = useRouter()
  const query = useGrowth()
  const create = useCreateGoal()
  const tasks = useTasks({ status: 'active' })
  const [creating, setCreating] = useState(false)
  const [status, setStatus] = useState<GoalStatus | 'all'>('active')
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [all, setAll] = useState(false)
  const [error, setError] = useState('')
  const goals = query.data?.goals ?? []
  const filtered = goals.filter(
    (goal) =>
      (status === 'all' || goal.status === status) &&
      (!category || goal.category === category) &&
      goal.title.toLowerCase().includes(search.toLowerCase())
  )
  const activeIds = new Set(goals.filter((goal) => goal.status === 'active').map((goal) => goal.id))
  const next =
    tasks.data
      ?.filter((task) => task.goalId && activeIds.has(task.goalId) && !task.routinePaused)
      .slice(0, 3) ?? []
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Small steps. Real learning."
        title="Grow at your own pace."
        description="Choose what matters, practise it, and keep the evidence of what changes."
      >
        <Button
          className="gap-2"
          onClick={() => {
            setCreating(true)
            setError('')
          }}
        >
          <Plus className="h-4 w-4" />
          New Goal
        </Button>
      </PageHeader>
      {query.isLoading ? (
        <LoadingState label="Loading growth" />
      ) : query.isError ? (
        <ErrorState retry={() => query.refetch()} />
      ) : (
        <>
          <section className="relative overflow-hidden rounded-[2rem] border bg-gradient-to-br from-primary/10 via-card to-amber-100/30 p-6 sm:p-8">
            <div
              aria-hidden="true"
              className="absolute -right-10 -top-16 h-64 w-64 rounded-full border-[35px] border-primary/5"
            />
            <div className="relative grid gap-7 lg:grid-cols-[1.5fr_1fr]">
              <div>
                <p className="eyebrow text-primary">This week · {query.data?.weekStart}</p>
                <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">
                  Make a little space for becoming.
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                  A useful example or a thoughtful attempt can tell you more than a long task list.
                  Rest and adjustments belong here too.
                </p>
                <div className="mt-6 flex flex-wrap gap-4 text-sm">
                  <span>
                    <strong>{goals.filter((goal) => goal.status === 'active').length}</strong>{' '}
                    active goals
                  </span>
                  <span>
                    <strong>{goals.reduce((sum, goal) => sum + goal.practiceCount, 0)}</strong> goal
                    practices recorded
                  </span>
                  <span>
                    <strong>{goals.reduce((sum, goal) => sum + goal.evidenceCount, 0)}</strong>{' '}
                    observations kept
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border bg-card/75 p-5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Keep learning close
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {query.data?.dueLearning
                    ? `${query.data.dueLearning} cards are ready for recall.`
                    : 'Your library is ready whenever you are.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-4">
                  <Link href="/flashcards" className="text-sm text-primary hover:underline">
                    Review learning →
                  </Link>
                  <Link href="/books" className="text-sm text-primary hover:underline">
                    Try a book idea →
                  </Link>
                </div>
              </div>
            </div>
          </section>
          <div className="flex flex-wrap gap-3">
            <Input
              aria-label="Search growth goals"
              placeholder="Find a goal…"
              className="sm:max-w-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              aria-label="Growth status"
              className="sm:w-44"
              value={status}
              onChange={(e) => setStatus(e.target.value as GoalStatus | 'all')}
            >
              <option value="active">Active goals</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Archived</option>
              <option value="all">All goals</option>
            </Select>
            <Select
              aria-label="Growth category"
              className="sm:w-44"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Every area</option>
              {['fitness', 'learning', 'work', 'personal', 'financial'].map((value) => (
                <option key={value} value={value}>
                  {value[0].toUpperCase() + value.slice(1)}
                </option>
              ))}
            </Select>
          </div>
          {!filtered.length ? (
            <EmptyState
              title="Start with one meaningful direction."
              description="Only a title is needed. You can add a practice and a way to recognise progress as you go."
              action="Create a goal"
              onAction={() => setCreating(true)}
            />
          ) : (
            <>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {(all ? filtered : filtered.slice(0, 6)).map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    practiceCount={goal.practiceCount}
                    onClick={() => router.push(`/goals/${goal.id}`)}
                  />
                ))}
              </div>
              {filtered.length > 6 && (
                <Button variant="outline" onClick={() => setAll(!all)}>
                  {all ? 'Show fewer goals' : `Show all ${filtered.length} goals`}
                </Button>
              )}
            </>
          )}
          <section className="surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <Leaf className="h-4 w-4 text-primary" />A next step when you are ready
              </h2>
              <Link className="text-sm text-primary hover:underline" href="/today">
                Plan my day
              </Link>
            </div>
            {tasks.isError ? (
              <ErrorState retry={() => tasks.refetch()} />
            ) : next.length ? (
              <div className="divide-y">
                {next.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex items-center justify-between gap-3 py-3 text-sm hover:text-primary"
                  >
                    <span>
                      {task.title}
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {goals.find((goal) => goal.id === task.goalId)?.title}
                        {task.plannedDate ? ` · ${task.plannedDate}` : ''}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Open a goal and choose one action. You decide when it belongs in your day.
              </p>
            )}
          </section>
        </>
      )}
      <Dialog
        open={creating}
        onClose={() => {
          if (!create.isPending) setCreating(false)
        }}
        title="New Goal"
      >
        <GoalForm
          onSubmit={async (data) => {
            setError('')
            try {
              await create.mutateAsync(data)
              setCreating(false)
            } catch {
              setError('Could not save this goal. Your input is kept; please retry.')
            }
          }}
          onCancel={() => setCreating(false)}
          isLoading={create.isPending}
        />
        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </Dialog>
    </div>
  )
}
