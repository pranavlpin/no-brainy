'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Coffee,
  Leaf,
  Play,
  Plus,
  X,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useTodayPlan, useDatePlan, useUpdatePlan, useUnfinishedTasks } from '@/hooks/use-planner'
import { useCreateTask, useTasks, useUpdateTask } from '@/hooks/use-tasks'
import { useDraftSave } from '@/hooks/use-draft-save'
import { useUIStore } from '@/stores/ui-store'
import { TaskPicker } from '@/components/planner/task-picker'
import { TimeBlockForm } from '@/components/planner/time-block-form'
import { UnfinishedWork } from '@/components/planner/unfinished-work'
import { AISuggestPanel } from '@/components/planner/ai-suggest-panel'
import { usePlannerAISuggest } from '@/hooks/use-planner-ai'
import { useAI } from '@/hooks/use-ai'
import type { DailyPlanSuggestion } from '@/lib/ai/types'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { SaveStatus } from '@/components/ui/save-status'
import { PageHeader, LoadingState, ErrorState } from '@/components/ui/workspace-states'
import { planCapacity } from '@/lib/planner/capacity'
import { calendarDate } from '@/lib/dates/calendar'
import type { TaskResponse } from '@/lib/types/tasks'
import type { TimeBlock } from '@/lib/types/planner'

const TaskForm = dynamic(
  () => import('@/components/tasks/task-form').then((module) => module.TaskForm),
  { loading: () => <LoadingState label="Opening action editor" /> }
)

export default function TodayPage() {
  const [date, setDate] = useState<string>()
  const [today, setToday] = useState<string>()
  const initial = useTodayPlan(!date)
  useEffect(() => {
    if (!date && initial.data && !initial.isFetching && !initial.isError) {
      setDate(initial.data.planDate.slice(0, 10))
      setToday(initial.data.planDate.slice(0, 10))
    }
  }, [date, initial.data, initial.isFetching, initial.isError])
  if (!date)
    return initial.isError ? (
      <ErrorState retry={() => void initial.refetch()} />
    ) : (
      <LoadingState label="Opening your day" />
    )
  return <DayWorkspace key={date} date={date} today={today ?? date} onDateChange={setDate} />
}

function DayWorkspace({
  date,
  today,
  onDateChange,
}: {
  date: string
  today: string
  onDateChange: (date: string) => void
}) {
  const query = useDatePlan(date)
  const update = useUpdatePlan(date)
  const tasks = useTasks({ status: 'active' })
  const unfinished = useUnfinishedTasks(date)
  const updateTask = useUpdateTask()
  const createTask = useCreateTask()
  const enterFocus = useUIStore((state) => state.enterFocusMode)
  const context = useUIStore((state) => state.context)
  const { isEnabled: aiEnabled } = useAI()
  const aiSuggest = usePlannerAISuggest()
  const [suggestion, setSuggestion] = useState<DailyPlanSuggestion | null>(null)
  const draft = useDraftSave(
    'day-plan',
    query.data,
    async (patch, version) =>
      (await update.mutateAsync({ ...patch, expectedUpdatedAt: version })).data,
    async () => (await query.refetch()).data
  )
  const [picker, setPicker] = useState<'priority' | 'growth' | null>(null)
  const [picked, setPicked] = useState<TaskResponse[]>([])
  const [creating, setCreating] = useState(false)
  const creatingLock = useRef(false)
  const [block, setBlock] = useState<TimeBlock | 'new' | null>(null)
  const [removing, setRemoving] = useState<TimeBlock | null>(null)
  const plan = draft.value
  if (query.isLoading) return <LoadingState label="Loading this day" />
  if (!plan || query.isError) return <ErrorState retry={() => void query.refetch()} />

  // Live task state is independent of the plan's editable version and pending draft.
  const taskMap = new Map(
    [
      ...picked,
      ...(query.data?.plannedTasks ?? []),
      ...(query.data?.focusTasks ?? []),
      ...(query.data?.growthTask ? [query.data.growthTask] : []),
      ...(tasks.data ?? []),
    ].map((task) => [task.id, task])
  )
  const priorities = plan.focusTaskIds.flatMap((id) => (taskMap.has(id) ? [taskMap.get(id)!] : []))
  const growth = plan.growthTaskId ? taskMap.get(plan.growthTaskId) : undefined
  const scheduled = query.data?.plannedTasks ?? []
  const main =
    priorities.find((task) => task.status === 'pending' || task.status === 'in_progress') ??
    (growth && ['pending', 'in_progress'].includes(growth.status) ? growth : undefined)
  const capacity = planCapacity({
    tasks: [
      ...priorities,
      ...scheduled,
      ...(growth ? [growth] : []),
      ...plan.timeBlocks.flatMap((item) =>
        item.taskId && taskMap.has(item.taskId) ? [taskMap.get(item.taskId)!] : []
      ),
    ],
    blocks: plan.timeBlocks,
    availableMinutes: plan.availableMinutes,
    bufferMinutes: plan.bufferMinutes,
    workStart: plan.workStart,
    workEnd: plan.workEnd,
  })
  const dateLabel = new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
  const activeTasks = tasks.data ?? []
  const saveBlock = (next: TimeBlock) => {
    draft.change({
      timeBlocks: [...plan.timeBlocks.filter((item) => item.id !== next.id), next].sort(
        (a, b) => a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id)
      ),
    })
    setBlock(null)
  }
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={dateLabel}
        title={date === today ? 'Today.' : 'Your day.'}
        description="A little intention. Enough space to follow through."
      >
        <label className="sr-only" htmlFor="planning-date">
          Planning date
        </label>
        <Input
          id="planning-date"
          type="date"
          value={date}
          className="w-40"
          onChange={(event) => {
            if (calendarDate(event.target.value)) onDateChange(event.target.value)
          }}
        />
        <Button variant="outline" className="gap-2" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          New action
        </Button>
      </PageHeader>
      <section
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 via-teal-900 to-teal-800 p-6 text-white shadow-soft-lg sm:p-9"
        aria-labelledby="today-intention-heading"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full border-[40px] border-white/[0.04]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-emerald-300/5 blur-2xl"
        />
        <div className="relative grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-emerald-100">
              <Leaf className="h-3.5 w-3.5" />
              Make room for what matters
            </span>
            <h2
              id="today-intention-heading"
              className="text-2xl font-medium tracking-tight sm:text-3xl"
            >
              What would make this day meaningful?
            </h2>
            <label htmlFor="main-outcome" className="mt-5 block text-xs text-emerald-100/80">
              Main outcome
            </label>
            <Input
              id="main-outcome"
              data-testid="today-outcome"
              value={plan.mainOutcome}
              maxLength={1000}
              placeholder="One thing you would feel good moving forward…"
              onChange={(event) => draft.change({ mainOutcome: event.target.value })}
              className="mt-2 h-12 border-white/20 bg-white/[0.07] text-white placeholder:text-white/45 focus-visible:ring-emerald-200"
            />
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100/65">
              Your next moment of focus
            </p>
            <p className="my-4 text-sm leading-6 text-white/90">
              {main?.title ?? 'Choose one action below. Small is a good place to start.'}
            </p>
            <Button
              data-testid="today-start-focus"
              disabled={!main}
              className="w-full gap-2 bg-emerald-100 text-emerald-950 hover:bg-white"
              onClick={() => {
                if (main) enterFocus(main.id)
              }}
            >
              <Play className="h-4 w-4" />
              Start Focus
            </Button>
          </div>
        </div>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SaveStatus
          state={draft.state}
          durable={draft.durable}
          retry={draft.retry}
          resolve={draft.resolve}
        />
        <span className="text-xs text-muted-foreground">Changes stay with {date}.</span>
      </div>
      {aiEnabled && date === today && (
        <div className="space-y-4">
          {suggestion ? (
            <AISuggestPanel
              suggestion={suggestion}
              allTasks={activeTasks}
              onAccept={(ids, brief) => {
                draft.change({ focusTaskIds: ids, aiBriefMd: brief })
                setSuggestion(null)
              }}
              onDismiss={() => setSuggestion(null)}
            />
          ) : (
            <Button
              variant="outline"
              disabled={aiSuggest.isPending}
              onClick={() =>
                aiSuggest.mutate(
                  { date },
                  {
                    onSuccess: (response) => setSuggestion(response.data),
                  }
                )
              }
            >
              {aiSuggest.isPending ? 'Thinking…' : 'Suggest a few priorities'}
            </Button>
          )}
          {aiSuggest.isError && (
            <p role="alert" className="text-sm text-destructive">
              Suggestions are unavailable. You can keep planning manually or try again.
            </p>
          )}
        </div>
      )}
      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <div className="min-w-0 space-y-7">
          <section className="surface p-5 sm:p-7" aria-labelledby="priorities-heading">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">One main action, two supporting steps</p>
                <h2 id="priorities-heading" className="mt-2 text-xl font-semibold">
                  A few things that matter.
                </h2>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs text-primary">
                {priorities.filter((task) => task.status === 'completed').length} /{' '}
                {priorities.length}
              </span>
            </div>
            <div className="space-y-3">
              {plan.focusTaskIds.map((id, index) => {
                const task = taskMap.get(id)
                return (
                  <div
                    key={id}
                    data-testid={`focus-task-${id}`}
                    className={`flex items-center gap-3 rounded-2xl border p-4 transition-colors ${task?.status === 'completed' ? 'border-primary/15 bg-primary/5' : 'border-border bg-background/60'}`}
                  >
                    <button
                      aria-label={`${task?.status === 'completed' ? 'Undo completion of' : 'Complete'} ${task?.title ?? 'unavailable action'}`}
                      disabled={!task || updateTask.isPending}
                      onClick={() => {
                        if (task)
                          updateTask.mutate({
                            id,
                            data: { status: task.status === 'completed' ? 'pending' : 'completed' },
                          })
                      }}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${task?.status === 'completed' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary'}`}
                    >
                      {task?.status === 'completed' && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {index === 0 ? 'Main action' : 'Supporting action'}
                      </p>
                      {task ? (
                        <Link
                          href={`/tasks/${id}`}
                          className={`text-sm font-medium hover:text-primary ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {task.title}
                        </Link>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          This action is no longer available.
                        </p>
                      )}
                      {task && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {task.estimatedMinutes
                            ? `${task.estimatedMinutes} min`
                            : 'No estimate yet'}
                          {task.dueDate ? ` · Due ${task.dueDate.slice(0, 10)}` : ''}
                        </p>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Remove ${task?.title ?? 'unavailable action'} from priorities`}
                      onClick={() =>
                        draft.change({
                          focusTaskIds: plan.focusTaskIds.filter((value) => value !== id),
                        })
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
            {plan.focusTaskIds.length < 3 && (
              <Button
                className="mt-4 w-full gap-2 border-dashed"
                variant="outline"
                onClick={() => setPicker('priority')}
              >
                <Plus className="h-4 w-4" />
                {plan.focusTaskIds.length ? 'Add a supporting priority' : 'Choose a priority'}
              </Button>
            )}
            {updateTask.isError && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                Could not update this action. Your previous status has been restored; please retry.
              </p>
            )}
          </section>
          <section className="surface-soft p-5 sm:p-7" aria-labelledby="growth-action-heading">
            <div className="flex items-start gap-4">
              <span className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Leaf className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="eyebrow">A little investment in yourself</p>
                <h2 id="growth-action-heading" className="mt-2 text-lg font-semibold">
                  One growth action.
                </h2>
                {growth ? (
                  <Link
                    className="mt-3 block text-sm text-primary hover:underline"
                    href={`/tasks/${growth.id}`}
                  >
                    {growth.title}
                  </Link>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Practice, reflect, or try something you’ve learned. This is optional.
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPicker('growth')}>
                    {growth ? 'Change growth action' : 'Choose a growth action'}
                  </Button>
                  {plan.growthTaskId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => draft.change({ growthTaskId: null })}
                    >
                      Clear
                    </Button>
                  )}
                  <Link
                    href="/goals"
                    className="inline-flex items-center gap-1 px-2 text-xs text-primary"
                  >
                    Explore growth
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
          {!!scheduled.filter(
            (task) => !plan.focusTaskIds.includes(task.id) && task.id !== plan.growthTaskId
          ).length && (
            <section className="surface p-5">
              <h2 className="mb-3 text-base font-semibold">Also planned for this day</h2>
              <ul className="space-y-2">
                {scheduled
                  .filter(
                    (task) => !plan.focusTaskIds.includes(task.id) && task.id !== plan.growthTaskId
                  )
                  .map((task) => (
                    <li key={task.id}>
                      <Link className="text-sm hover:text-primary" href={`/tasks/${task.id}`}>
                        {task.title}
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          )}
          <details className="group rounded-2xl border bg-card/70 p-5">
            <summary className="cursor-pointer text-sm font-medium">
              Earlier unfinished work{' '}
              {unfinished.data ? `(${unfinished.data.suggestions.length})` : ''}
            </summary>
            <div className="mt-5">
              {unfinished.isError ? (
                <ErrorState retry={() => void unfinished.refetch()} />
              ) : unfinished.isLoading ? (
                <LoadingState label="Loading earlier work" />
              ) : (
                <UnfinishedWork tasks={unfinished.data?.suggestions ?? []} date={date} />
              )}
            </div>
          </details>
          {!!query.data?.tasksDueToday.length && (
            <details className="rounded-2xl border bg-card/70 p-5">
              <summary className="cursor-pointer text-sm font-medium">
                Deadlines on this day ({query.data.tasksDueToday.length})
              </summary>
              <ul className="mt-4 space-y-3">
                {query.data.tasksDueToday.map((task) => (
                  <li key={task.id}>
                    <Link
                      className={`text-sm hover:text-primary ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}
                      href={`/tasks/${task.id}`}
                    >
                      {task.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
        <div className="min-w-0 space-y-6">
          <section className="surface p-5 sm:p-6" aria-labelledby="capacity-heading">
            <div className="mb-5 flex items-center gap-3">
              <span className="rounded-xl bg-amber-500/10 p-2.5 text-amber-700 dark:text-amber-300">
                <Coffee className="h-5 w-5" />
              </span>
              <div>
                <p className="eyebrow">Leave some breathing room</p>
                <h2 id="capacity-heading" className="mt-1 text-lg font-semibold">
                  Your capacity
                </h2>
              </div>
            </div>
            <div data-testid="capacity-control" className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="available-minutes" className="text-xs font-medium">
                  Available minutes
                </label>
                <Input
                  id="available-minutes"
                  type="number"
                  min={0}
                  max={1440}
                  value={plan.availableMinutes}
                  onChange={(event) =>
                    draft.change({ availableMinutes: Number(event.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="buffer-minutes" className="text-xs font-medium">
                  Buffer minutes
                </label>
                <Input
                  id="buffer-minutes"
                  type="number"
                  min={0}
                  max={1440}
                  value={plan.bufferMinutes}
                  onChange={(event) => draft.change({ bufferMinutes: Number(event.target.value) })}
                />
              </div>
            </div>
            <label className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={!!plan.workStart}
                onChange={(event) =>
                  draft.change({
                    workStart: event.target.checked ? '09:00' : null,
                    workEnd: event.target.checked ? '18:00' : null,
                  })
                }
              />
              Use a working window
            </label>
            {plan.workStart && plan.workEnd && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="work-start" className="text-xs text-muted-foreground">
                    Window starts
                  </label>
                  <Input
                    id="work-start"
                    type="time"
                    value={plan.workStart}
                    onChange={(event) => {
                      if (event.target.value) draft.change({ workStart: event.target.value })
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="work-end" className="text-xs text-muted-foreground">
                    Window ends
                  </label>
                  <Input
                    id="work-end"
                    type="time"
                    value={plan.workEnd}
                    onChange={(event) => {
                      if (event.target.value) draft.change({ workEnd: event.target.value })
                    }}
                  />
                </div>
              </div>
            )}
            <div className="mt-6 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-semibold tracking-tight">
                {capacity.plannedMinutes}
                <span className="ml-1 text-xs font-normal text-muted-foreground">min planned</span>
              </span>
              <span className="text-xs text-muted-foreground">
                of {capacity.availableMinutes} available
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${capacity.overBy ? 'bg-amber-500' : 'bg-primary'}`}
                style={{
                  width: `${Math.min(100, capacity.availableMinutes ? (capacity.plannedMinutes / capacity.availableMinutes) * 100 : 100)}%`,
                }}
              />
            </div>
            <div className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
              {capacity.overBy > 0 && (
                <p role="status" className="text-amber-700 dark:text-amber-300">
                  {capacity.overBy} minutes over capacity. Choose what to move, reduce or keep.
                </p>
              )}
              {capacity.unknownTaskIds.length > 0 && (
                <p>
                  {capacity.unknownTaskIds.length} action
                  {capacity.unknownTaskIds.length > 1 ? 's have' : ' has'} no estimate. The total is
                  incomplete.
                </p>
              )}
              {capacity.fits && (
                <p>
                  Fits your current estimates, with {plan.bufferMinutes} minutes of breathing room.
                </p>
              )}
              <p>
                A linked action counts once using its estimate or scheduled time, whichever is
                larger.
              </p>
            </div>
            <Button
              className="mt-4 w-full"
              variant="ghost"
              size="sm"
              onClick={() => draft.change({ availableMinutes: 60, bufferMinutes: 10 })}
            >
              Make a smaller day
            </Button>
          </section>
          <section className="surface p-5 sm:p-6" aria-labelledby="schedule-heading">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="schedule-heading" className="flex items-center gap-2 text-lg font-semibold">
                <Clock3 className="h-4 w-4 text-primary" />
                Make time
              </h2>
              <span className="text-xs text-muted-foreground">{plan.timeBlocks.length} blocks</span>
            </div>
            {capacity.overlaps.length > 0 && (
              <p
                role="status"
                className="mb-3 rounded-xl bg-amber-500/10 p-3 text-xs leading-5 text-amber-800 dark:text-amber-200"
              >
                Some time blocks overlap. Edit their times if you need separate space.
              </p>
            )}
            <div className="space-y-3">
              {plan.timeBlocks.map((item) => (
                <article
                  key={item.id}
                  data-testid={`time-block-${item.id}`}
                  className="rounded-2xl border bg-background/60 p-4"
                >
                  <p className="text-xs font-medium text-primary">
                    {item.startTime} — {item.endTime}
                  </p>
                  <p
                    className={`mt-2 text-sm font-medium ${item.isCompleted ? 'line-through text-muted-foreground' : ''}`}
                  >
                    {item.title}
                  </p>
                  {item.taskId && (
                    <Link
                      className="mt-1 block text-xs text-muted-foreground hover:text-primary"
                      href={`/tasks/${item.taskId}`}
                    >
                      Open linked action
                    </Link>
                  )}
                  {plan.workStart &&
                    plan.workEnd &&
                    (item.startTime < plan.workStart || item.endTime > plan.workEnd) && (
                      <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                        Outside your working window
                      </p>
                    )}
                  <div className="mt-3 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`${item.isCompleted ? 'Reopen' : 'Complete'} block ${item.title}`}
                      onClick={() =>
                        draft.change({
                          timeBlocks: plan.timeBlocks.map((value) =>
                            value.id === item.id
                              ? { ...value, isCompleted: !value.isCompleted }
                              : value
                          ),
                        })
                      }
                    >
                      <Check className="mr-1 h-3 w-3" />
                      {item.isCompleted ? 'Done' : 'Complete'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${item.title}`}
                      onClick={() => setBlock(item)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${item.title}`}
                      onClick={() => setRemoving(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
            {!plan.timeBlocks.length && (
              <p className="mb-4 text-sm leading-6 text-muted-foreground">
                Give important work a place in the day. Leave space around it.
              </p>
            )}
            <Button className="mt-4 w-full gap-2" variant="outline" onClick={() => setBlock('new')}>
              <Plus className="h-4 w-4" />
              Add time block
            </Button>
          </section>
          <Link
            href={`/reviews/daily?date=${date}`}
            className="surface-soft flex items-center justify-between gap-3 p-5 text-sm font-medium hover:text-primary"
          >
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Close the day thoughtfully
            </span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      {tasks.isError && (
        <ErrorState
          message="Task choices could not load. Your saved plan is still available."
          retry={() => void tasks.refetch()}
        />
      )}
      <Dialog
        open={!!picker}
        onClose={() => setPicker(null)}
        title={picker === 'growth' ? 'Choose a growth action' : 'Choose a priority'}
        description="Any active task can fit here, including one without a deadline."
      >
        <TaskPicker
          excludedIds={picker === 'priority' ? plan.focusTaskIds : []}
          onSelect={(task) => {
            setPicked((current) => [...current.filter((item) => item.id !== task.id), task])
            if (picker === 'priority' && plan.focusTaskIds.length < 3)
              draft.change({ focusTaskIds: [...plan.focusTaskIds, task.id] })
            else if (picker === 'growth') draft.change({ growthTaskId: task.id })
            setPicker(null)
          }}
        />
      </Dialog>
      <Dialog
        open={creating}
        onClose={() => {
          if (!creatingLock.current) setCreating(false)
        }}
        title="A new action"
        className="max-w-xl"
      >
        <TaskForm
          initialData={{ plannedDate: date, ...(context !== 'all' && { context }) }}
          submitLabel="Create action"
          isPending={createTask.isPending}
          onSubmit={(data) => {
            if (creatingLock.current) return
            creatingLock.current = true
            createTask.mutate(data, {
              onSuccess: (result) => {
                setPicked((current) => [...current, result.data])
                setCreating(false)
              },
              onSettled: () => {
                creatingLock.current = false
              },
            })
          }}
        />
        {createTask.isError && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            Could not create this action. Your entries are kept; please retry.
          </p>
        )}
      </Dialog>
      <Dialog
        open={!!block}
        onClose={() => setBlock(null)}
        title={block === 'new' ? 'Make a little time' : 'Edit time block'}
      >
        {block && (
          <TimeBlockForm
            key={typeof block === 'string' ? block : block.id}
            initial={typeof block === 'string' ? undefined : block}
            tasks={activeTasks}
            onSave={saveBlock}
          />
        )}
      </Dialog>
      <Dialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title="Remove time block?"
        description="The linked action stays available."
        confirmLabel="Remove block"
        onConfirm={() => {
          if (removing)
            draft.change({ timeBlocks: plan.timeBlocks.filter((item) => item.id !== removing.id) })
          setRemoving(null)
        }}
      />
    </div>
  )
}
