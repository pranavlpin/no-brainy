'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Check, Leaf, Plus, Target } from 'lucide-react'
import { useGrowth, useGrowthEvidence, useDeleteEvidence } from '@/hooks/use-growth'
import { useUpdateGoal, useDeleteGoal } from '@/hooks/use-goals'
import { useTasks, useRoutineAction, useUpdateTask } from '@/hooks/use-tasks'
import { useUIStore } from '@/stores/ui-store'
import { weekStartFor } from '@/lib/growth/progress'
import { addCalendarDays } from '@/lib/dates/calendar'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { PageHeader, LoadingState, ErrorState } from '@/components/ui/workspace-states'
import { GoalForm } from '@/components/goals/goal-form'
import { ActionComposer } from '@/components/growth/action-composer'
import { EvidenceForm } from '@/components/growth/evidence-form'
import type { GoalResponse, GoalStatus } from '@/lib/types/goals'
import type { EvidenceResponse, EvidenceKind } from '@/lib/types/growth'

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [week, setWeek] = useState<string>()
  const query = useGrowth(id, week)
  const goal = query.data?.goals[0]
  const tasks = useTasks({ goalId: id })
  const updateTask = useUpdateTask()
  const routine = useRoutineAction()
  const update = useUpdateGoal()
  const remove = useDeleteGoal()
  const removeEvidence = useDeleteEvidence()
  const enterFocus = useUIStore((state) => state.enterFocusMode)
  const [page, setPage] = useState(1)
  const evidence = useGrowthEvidence(id, page)
  const [edit, setEdit] = useState<GoalResponse | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [creatingAction, setCreatingAction] = useState(false)
  const [recording, setRecording] = useState<EvidenceKind | null>(null)
  const [correcting, setCorrecting] = useState<EvidenceResponse | null>(null)
  const [deletingEvidence, setDeletingEvidence] = useState<EvidenceResponse | null>(null)
  const [allTasks, setAllTasks] = useState(false)
  const [error, setError] = useState('')
  async function perform(action: () => Promise<unknown>) {
    setError('')
    try {
      await action()
    } catch (e) {
      setError(
        (e as { error?: { message?: string } })?.error?.message ??
          'Could not save this change. Please retry.'
      )
    }
  }
  if (query.isLoading) return <LoadingState label="Loading your goal" />
  if (query.isError || !goal) return <ErrorState retry={() => query.refetch()} />
  const active =
    tasks.data?.filter((task) => ['pending', 'in_progress'].includes(task.status)) ?? []
  const done = tasks.data?.filter((task) => !['pending', 'in_progress'].includes(task.status)) ?? []
  return (
    <div className="space-y-7">
      <Link
        href="/goals"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Growth
      </Link>
      <PageHeader
        eyebrow={goal.category ?? 'A meaningful direction'}
        title={goal.title}
        description={goal.description || undefined}
      >
        <Button
          variant="outline"
          onClick={() => {
            setError('')
            setEdit(goal)
          }}
        >
          Edit goal
        </Button>
        <Select
          aria-label="Goal status"
          className="w-36"
          value={goal.status}
          disabled={update.isPending}
          onChange={(e) =>
            void perform(() =>
              update.mutateAsync({
                id,
                data: { status: e.target.value as GoalStatus, expectedUpdatedAt: goal.updatedAt },
              })
            )
          }
        >
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="abandoned">Archived</option>
        </Select>
      </PageHeader>
      {error && !edit && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <section className="surface relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-7">
          <Target
            aria-hidden="true"
            className="absolute -bottom-5 -right-5 h-40 w-40 text-primary/5"
          />
          <p className="eyebrow text-primary">What success looks like</p>
          <h2 className="relative mt-4 text-lg font-medium leading-relaxed">
            {goal.successCriteria ||
              'You can define success in your own words when it becomes clearer.'}
          </h2>
          <div data-testid="goal-measurement" className="relative mt-6 border-t pt-5">
            {goal.category === 'financial' ? (
              <>
                <p className="text-2xl font-semibold">
                  ₹{(goal.currentAmount ?? 0).toLocaleString('en-IN')}{' '}
                  <span className="text-sm font-normal text-muted-foreground">
                    of ₹{(goal.targetAmount ?? 0).toLocaleString('en-IN')} tracked
                  </span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Amount matched by the saved expense category or tag and date window.
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-semibold">
                  {goal.measurement == null ? (
                    <span className="text-base font-normal text-muted-foreground">
                      No measurement recorded yet.
                    </span>
                  ) : (
                    `${goal.measurement} ${goal.unit ?? ''}`
                  )}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {goal.baseline != null
                    ? `Baseline ${goal.baseline}${goal.unit ? ` ${goal.unit}` : ''}`
                    : 'Optional measurements can make change easier to notice.'}
                  {goal.target != null ? ` · Target ${goal.target}` : ''}
                  {goal.measurementDate ? ` · Observed ${goal.measurementDate}` : ''}
                </p>
                {goal.outcomePercent != null && (
                  <div
                    className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
                    aria-label={`${goal.outcomePercent}% of measured change toward target`}
                  >
                    <div
                      className="h-full bg-primary transition-[width] duration-500"
                      style={{ width: `${goal.outcomePercent}%` }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <p className="relative mt-6 text-xs text-muted-foreground">
            {goal.completedTaskCount ?? 0} of {goal.taskCount ?? 0} linked actions complete. Actions
            and outcome measurements are tracked separately.
          </p>
        </section>
        <section className="surface p-6" data-testid="goal-practice">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <Leaf className="h-4 w-4 text-primary" />
              Practice, with room to rest
            </h2>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <Button
              size="sm"
              variant="ghost"
              aria-label="Previous practice week"
              onClick={() => setWeek(addCalendarDays(query.data!.weekStart, -7))}
            >
              ←
            </Button>
            <span>Week of {query.data?.weekStart}</span>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Next practice week"
              onClick={() => setWeek(addCalendarDays(query.data!.weekStart, 7))}
            >
              →
            </Button>
          </div>
          <p className="mt-5 text-4xl font-semibold tabular-nums">
            {goal.practiceCount}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {goal.weeklyPracticeTarget
                ? `of ${goal.weeklyPracticeTarget} planned practices`
                : 'recorded practices'}
            </span>
          </p>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            A routine and its linked Focus session count once. Rest and skips stay visible without a
            streak penalty.
          </p>
          {goal.status === 'paused' ? (
            <p className="mt-4 text-sm text-primary">
              Practice is paused. Your history stays here.
            </p>
          ) : goal.status === 'abandoned' ? (
            <p className="mt-4 text-sm text-muted-foreground">
              This goal is archived. Your history stays here.
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setRecording('practice')}>
              Log practice
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRecording('rest')}>
              Record rest
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRecording('skip')}>
              Record a skip
            </Button>
          </div>
          {week && week !== weekStartFor(query.data!.today) && (
            <Button size="sm" variant="link" onClick={() => setWeek(undefined)}>
              Return to this week
            </Button>
          )}
        </section>
      </div>
      <section className="surface p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Next actions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Make the next step small enough to begin.
            </p>
          </div>
          <Button
            className="gap-2"
            disabled={goal.status !== 'active'}
            onClick={() => setCreatingAction(true)}
          >
            <Plus className="h-4 w-4" />
            Add next action
          </Button>
        </div>
        {tasks.isLoading ? (
          <p role="status">Loading actions…</p>
        ) : tasks.isError ? (
          <ErrorState retry={() => tasks.refetch()} />
        ) : (
          <>
            <div className="divide-y">
              {active.map((task) => (
                <article
                  key={task.id}
                  data-testid={`goal-action-${task.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="text-sm font-medium hover:text-primary"
                    >
                      {task.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {task.plannedDate ? `Planned ${task.plannedDate}` : 'Not scheduled'}
                      {task.estimatedMinutes ? ` · ${task.estimatedMinutes} min` : ''}
                      {task.isRecurring
                        ? ` · ${task.routinePaused ? 'Paused routine' : 'Routine'}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={`Focus on ${task.title}`}
                      onClick={() => enterFocus(task.id)}
                    >
                      Focus
                    </Button>
                    {!task.plannedDate && (
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Plan ${task.title} for Today`}
                        disabled={updateTask.isPending}
                        onClick={() =>
                          void perform(() =>
                            updateTask.mutateAsync({
                              id: task.id,
                              data: { plannedDate: query.data!.today },
                            })
                          )
                        }
                      >
                        Plan Today
                      </Button>
                    )}
                    {task.isRecurring && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={routine.isPending}
                          onClick={() =>
                            void perform(() =>
                              routine.mutateAsync({
                                id: task.id,
                                action: task.routinePaused ? 'resume' : 'pause',
                              })
                            )
                          }
                        >
                          {task.routinePaused ? 'Resume routine' : 'Pause routine'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={routine.isPending || task.routinePaused}
                          onClick={() =>
                            void perform(() => routine.mutateAsync({ id: task.id, action: 'skip' }))
                          }
                        >
                          Skip this occurrence
                        </Button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
            {!active.length && (
              <p className="py-4 text-sm text-muted-foreground">
                There is room for a next step when you are ready.
              </p>
            )}
            {done.length > 0 && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setAllTasks(!allTasks)}>
                  {allTasks
                    ? 'Hide earlier actions'
                    : `Show ${done.length} completed / dropped actions`}
                </Button>
                {allTasks && (
                  <div className="mt-3 divide-y">
                    {done.map((task) => (
                      <Link
                        key={task.id}
                        href={`/tasks/${task.id}`}
                        className="flex items-center gap-2 py-3 text-sm text-muted-foreground"
                      >
                        <Check className="h-4 w-4" />
                        {task.title}
                        <span className="ml-auto text-xs">{task.status}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>
      <section className="surface p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Evidence & reflections</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep examples of what changed, and what you want to try next.
            </p>
          </div>
          <Button variant="outline" onClick={() => setRecording('reflection')}>
            Add evidence
          </Button>
        </div>
        {evidence.isLoading ? (
          <p role="status">Loading evidence…</p>
        ) : evidence.isError ? (
          <ErrorState retry={() => evidence.refetch()} />
        ) : (
          <>
            <div className="space-y-4">
              {evidence.data?.items.map((item) => (
                <article
                  key={item.id}
                  data-testid={`evidence-${item.id}`}
                  className="rounded-2xl border bg-background/50 p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      {item.observedAt} · {item.kind === 'skip' ? 'deliberate skip' : item.kind}
                    </span>
                    <div className="flex gap-3">
                      <button
                        className="hover:text-primary"
                        onClick={() => setCorrecting(item)}
                        aria-label={`Correct evidence from ${item.observedAt}`}
                      >
                        Correct
                      </button>
                      <button
                        className="hover:text-destructive"
                        onClick={() => setDeletingEvidence(item)}
                        aria-label={`Remove evidence from ${item.observedAt}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6">{item.summary}</p>
                  {item.measurement != null && (
                    <p className="mt-3 text-sm font-medium">
                      Observed: {item.measurement} {goal.unit}
                    </p>
                  )}
                  {item.sourceTitle &&
                    (item.sourceHref ? (
                      <Link
                        href={item.sourceHref}
                        className="mt-3 inline-block text-xs text-primary hover:underline"
                      >
                        Source: {item.sourceTitle} →
                      </Link>
                    ) : (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Source: {item.sourceTitle} (no longer available)
                      </p>
                    ))}
                </article>
              ))}
            </div>
            {!evidence.data?.items.length && (
              <p className="py-4 text-sm text-muted-foreground">
                A short observation is enough. You do not need to prove progress every day.
              </p>
            )}
            <div className="mt-5 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Newer evidence
              </Button>
              <span className="text-xs text-muted-foreground">
                {evidence.data?.total ?? 0} observations
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={!evidence.data?.hasMore}
                onClick={() => setPage((p) => p + 1)}
              >
                Older evidence
              </Button>
            </div>
          </>
        )}
      </section>
      {(goal.projects.length > 0 || goal.notes.length > 0) && (
        <section className="surface grid gap-5 p-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-3 font-semibold">Supporting projects</h2>
            {goal.projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="mb-2 block text-sm text-primary hover:underline"
              >
                {project.title} · {project.status}
              </Link>
            ))}
          </div>
          <div>
            <h2 className="mb-3 font-semibold">Linked notes</h2>
            {goal.notes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="mb-2 block text-sm text-primary hover:underline"
              >
                {note.title || 'Untitled note'}
              </Link>
            ))}
          </div>
        </section>
      )}
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">Goal management</summary>
        <p className="my-3">
          Archiving retains your history. Deleting removes this goal and its evidence permanently.
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() => setDeleting(true)}
        >
          Delete goal permanently
        </Button>
      </details>
      <Dialog
        open={!!edit}
        onClose={() => {
          if (!update.isPending) setEdit(null)
        }}
        title="Edit Goal"
      >
        {edit && (
          <GoalForm
            goal={edit}
            onSubmit={(data) =>
              void perform(async () => {
                await update.mutateAsync({
                  id,
                  data: { ...data, expectedUpdatedAt: edit.updatedAt },
                })
                setEdit(null)
              })
            }
            onCancel={() => setEdit(null)}
            isLoading={update.isPending}
          />
        )}{' '}
        {error && (
          <div role="alert" className="mt-3 text-sm text-destructive">
            {error}
            <Button
              variant="link"
              onClick={() => {
                setEdit(null)
                setError('')
                void query.refetch()
              }}
            >
              Discard edits & reload
            </Button>
          </div>
        )}
      </Dialog>
      <Dialog
        open={creatingAction}
        onClose={() => setCreatingAction(false)}
        title="One useful next step"
      >
        <ActionComposer goalId={id} onCreated={() => setCreatingAction(false)} />
      </Dialog>
      <Dialog
        open={!!recording || !!correcting}
        onClose={() => {
          setRecording(null)
          setCorrecting(null)
        }}
        title={correcting ? 'Correct an observation' : 'Keep an observation'}
      >
        {(recording || correcting) && (
          <EvidenceForm
            goalId={id}
            today={query.data!.today}
            initial={correcting ?? undefined}
            initialKind={recording ?? 'reflection'}
            onSaved={() => {
              setRecording(null)
              setCorrecting(null)
              setPage(1)
            }}
          />
        )}
      </Dialog>
      <Dialog
        open={!!deletingEvidence}
        onClose={() => setDeletingEvidence(null)}
        title="Remove this observation?"
        description="This removes the evidence record. Its original source stays unchanged."
        confirmLabel="Remove evidence"
        variant="destructive"
        onConfirm={() =>
          void perform(async () => {
            await removeEvidence.mutateAsync(deletingEvidence!.id)
            setDeletingEvidence(null)
          })
        }
      />
      <Dialog
        open={deleting}
        onClose={() => setDeleting(false)}
        title="Delete this goal permanently?"
        description="Its evidence will also be removed. Linked tasks and projects remain. Choose Archived in the status menu to keep the history instead."
        confirmLabel="Delete goal"
        variant="destructive"
        onConfirm={() =>
          void perform(async () => {
            await remove.mutateAsync(id)
            router.push('/goals')
          })
        }
      />
    </div>
  )
}
