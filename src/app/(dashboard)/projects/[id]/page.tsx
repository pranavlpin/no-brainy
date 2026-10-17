'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, FileText, Focus, Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardLabel } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StaggerBlock, StaggerGroup } from '@/components/motion'
import { ProjectForm } from '@/components/projects/project-form'
import { TaskList } from '@/components/tasks/task-list'
import { useAddProjectAction, useProject, useUpdateProject } from '@/hooks/use-projects'
import { useNotes } from '@/hooks/use-notes'
import { useToast } from '@/hooks/use-toast'
import { useSetBreadcrumbTitle } from '@/stores/breadcrumb-store'
import { useUIStore } from '@/stores/ui-store'
import type { ProjectStatus, ProjectUpdate } from '@/lib/types/projects'

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const query = useProject(id)
  const update = useUpdateProject()
  const addAction = useAddProjectAction()
  const toast = useToast()
  const enterFocusMode = useUIStore((s) => s.enterFocusMode)
  const [editing, setEditing] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [title, setTitle] = useState('')
  const [noteSearch, setNoteSearch] = useState('')
  const [noteId, setNoteId] = useState('')
  const [error, setError] = useState('')
  const submission = useRef<{ title: string; id: string } | null>(null)
  const notes = useNotes({ search: noteSearch || undefined })
  const project = query.data

  useSetBreadcrumbTitle(project?.title ?? null)

  const change = async (data: ProjectUpdate) => {
    if (!project) return false
    setError('')
    try {
      await update.mutateAsync({ id, data: { ...data, expectedUpdatedAt: project.updatedAt } })
      return true
    } catch (err) {
      const code = (err as { error?: { code?: string } })?.error?.code
      setError(
        code === 'CONFLICT'
          ? 'This project changed elsewhere. Reloading it.'
          : 'Could not save this change. Try again.'
      )
      if (code === 'CONFLICT') void query.refetch()
      return false
    }
  }

  const submitAction = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || addAction.isPending) return
    if (!submission.current || submission.current.title !== trimmed) {
      submission.current = { title: trimmed, id: newId() }
    }
    setError('')
    try {
      await addAction.mutateAsync({ id, title: submission.current.title, submissionId: submission.current.id })
      setTitle('')
      submission.current = null
      toast.show('Next action set')
    } catch {
      setError('Could not add this action. Your text is kept; retrying will not duplicate it.')
    }
  }

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }
  if (!project || query.isError) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        This project could not be loaded.{' '}
        <button className="text-retro-blue underline" onClick={() => void query.refetch()}>
          Retry
        </button>
      </div>
    )
  }

  const openTasks = project.tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress')
  const linkedIds = new Set(project.notes.map((n) => n.id))
  const availableNotes = (notes.data ?? []).filter((n) => !linkedIds.has(n.id))

  return (
    <StaggerGroup className="mx-auto max-w-4xl space-y-5">
      <StaggerBlock>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/projects')} aria-label="All projects">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <CardLabel>
              {project.context} project · {project.status}
            </CardLabel>
            <h1 className="truncate font-display text-2xl font-bold text-retro-dark">{project.title}</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
          {project.status === 'archived' ? (
            <Button size="sm" disabled={update.isPending} onClick={() => void change({ status: 'active' })}>
              Restore
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setArchiving(true)}>
              Archive
            </Button>
          )}
        </div>
        <p className="mt-2 text-sm leading-6 text-retro-dark/80">
          {project.outcome || 'What would a meaningful finish look like? Add an outcome to steer the next step.'}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-xs text-retro-dark/60">
          <span>
            {project.completedTaskCount} of {project.taskCount} done
          </span>
          {project.goalId && (
            <Link className="inline-flex items-center gap-1 text-retro-blue hover:underline" href="/goals">
              <Target className="h-3 w-3" /> Serves a goal
            </Link>
          )}
          {project.status !== 'archived' && (
            <Select
              className="h-8 sm:ml-auto sm:w-40"
              aria-label="Project status"
              value={project.status}
              disabled={update.isPending}
              onChange={(e) => void change({ status: e.target.value as ProjectStatus })}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </Select>
          )}
        </div>
      </StaggerBlock>

      {error && (
        <StaggerBlock>
          <p role="alert" className="rounded-xl border border-retro-pink/40 bg-retro-pink/5 px-4 py-3 text-sm text-retro-pink">
            {error}
          </p>
        </StaggerBlock>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          <StaggerBlock>
            <Card className="border-retro-blue/30" data-testid="project-next-action">
              <CardLabel>Keep it moving</CardLabel>
              <h2 className="mt-1 font-display text-lg font-semibold text-retro-dark">One clear next step</h2>
              {project.nextAction ? (
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-background/70 p-3">
                  <Link href={`/tasks/${project.nextAction.id}`} className="min-w-0 flex-1 truncate text-base font-medium text-retro-dark hover:underline">
                    {project.nextAction.title}
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => enterFocusMode(project.nextAction!.id)}>
                    <Focus className="mr-1 h-3.5 w-3.5" /> Focus
                  </Button>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Choose something small enough to begin.</p>
              )}
              <form className="mt-4 space-y-1" onSubmit={(e) => void submitAction(e)}>
                <label htmlFor="project-add-action" className="text-xs font-medium text-retro-dark">
                  New next action
                </label>
                <div className="flex gap-2">
                  <Input
                    id="project-add-action"
                    data-testid="project-add-action"
                    value={title}
                    maxLength={500}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Start with a verb…"
                    className="min-w-0 flex-1"
                  />
                  <Button type="submit" size="sm" disabled={addAction.isPending || !title.trim()}>
                    <Plus className="mr-1 h-4 w-4" /> Add
                  </Button>
                </div>
              </form>
              {openTasks.length > 0 && (
                <div className="mt-3">
                  <label htmlFor="project-existing-next" className="text-xs text-retro-dark/60">
                    Or pick an existing open task
                  </label>
                  <Select
                    id="project-existing-next"
                    className="mt-1 h-8"
                    value={project.nextActionId ?? ''}
                    disabled={update.isPending}
                    onChange={(e) => void change({ nextActionId: e.target.value || null })}
                  >
                    <option value="">None selected</option>
                    {openTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </Card>
          </StaggerBlock>

          <StaggerBlock>
            <div className="mb-2 px-1">
              <CardLabel>Actions</CardLabel>
            </div>
            <TaskList tasks={project.tasks} emptyMessage="No actions yet. Add the first one above." />
          </StaggerBlock>
        </div>

        <StaggerBlock>
          <Card>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-retro-yellow/30">
                <FileText className="h-4 w-4 text-retro-dark" />
              </span>
              <div>
                <CardLabel>Supporting notes</CardLabel>
                <p className="text-sm text-retro-dark">Thinking and decisions, close to the work</p>
              </div>
            </div>
            <ul className="my-4 space-y-1.5">
              {project.notes.map((note) => (
                <li
                  key={note.id}
                  data-testid={`project-note-${note.id}`}
                  className="flex items-center gap-2 rounded-xl bg-background/70 px-3 py-2"
                >
                  <Link className="min-w-0 flex-1 truncate text-sm text-retro-dark hover:underline" href={`/notes/${note.id}`}>
                    {note.title || 'Untitled note'}
                  </Link>
                  <button
                    type="button"
                    aria-label={`Unlink ${note.title || 'Untitled note'}`}
                    disabled={update.isPending}
                    className="font-mono text-[11px] text-retro-dark/50 hover:text-retro-pink"
                    onClick={() =>
                      void change({ noteIds: project.notes.filter((n) => n.id !== note.id).map((n) => n.id) })
                    }
                  >
                    Unlink
                  </button>
                </li>
              ))}
              {project.notes.length === 0 && (
                <li className="text-sm text-muted-foreground">No notes linked yet.</li>
              )}
            </ul>
            <div className="space-y-2">
              <Input
                aria-label="Find notes to link"
                placeholder="Find a note…"
                value={noteSearch}
                onChange={(e) => {
                  setNoteSearch(e.target.value)
                  setNoteId('')
                }}
              />
              <div className="flex gap-2">
                <Select aria-label="Note to link" value={noteId} onChange={(e) => setNoteId(e.target.value)} className="min-w-0 flex-1">
                  <option value="">Choose a note</option>
                  {availableNotes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title || 'Untitled note'}
                    </option>
                  ))}
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!noteId || update.isPending}
                  onClick={async () => {
                    if (await change({ noteIds: [...project.notes.map((n) => n.id), noteId] })) setNoteId('')
                  }}
                >
                  Link
                </Button>
              </div>
            </div>
          </Card>
        </StaggerBlock>
      </div>

      <Dialog open={editing} onClose={() => setEditing(false)} title="Edit project">
        <ProjectForm
          initial={{ title: project.title, outcome: project.outcome, context: project.context, goalId: project.goalId }}
          label="Save project"
          onSave={async (data) => {
            if (await change(data)) setEditing(false)
          }}
        />
      </Dialog>
      <Dialog
        open={archiving}
        onClose={() => setArchiving(false)}
        title="Archive this project?"
        description="Actions, notes, and progress stay. You can restore it any time."
        confirmLabel="Archive"
        onConfirm={() => {
          void change({ status: 'archived' }).then((ok) => ok && setArchiving(false))
        }}
      />
      <Link href="/projects" className="sr-only">
        All projects <ArrowRight className="h-3 w-3" />
      </Link>
    </StaggerGroup>
  )
}
