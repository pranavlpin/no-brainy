'use client'

import { useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, FileText, Plus } from 'lucide-react'
import { useProject, useUpdateProject, useAddProjectAction } from '@/hooks/use-projects'
import { useNotes } from '@/hooks/use-notes'
import { ProjectForm } from '@/components/projects/project-form'
import { TaskList } from '@/components/tasks/task-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { PageHeader, LoadingState, ErrorState } from '@/components/ui/workspace-states'
import type { ProjectUpdate } from '@/lib/types/projects'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const projectQuery = useProject(id)
  const update = useUpdateProject()
  const addAction = useAddProjectAction()
  const [editing, setEditing] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [title, setTitle] = useState('')
  const [search, setSearch] = useState('')
  const [noteId, setNoteId] = useState('')
  const [error, setError] = useState('')
  const submission = useRef<{ title: string; id: string } | null>(null)
  const adding = useRef(false)
  const notes = useNotes({ search })
  const project = projectQuery.data
  const save = async (data: ProjectUpdate) => {
    if (!project) return
    return update.mutateAsync({ id, data: { ...data, expectedUpdatedAt: project.updatedAt } })
  }
  const change = async (data: ProjectUpdate) => {
    setError('')
    try {
      await save(data)
      return true
    } catch {
      setError(
        'Could not save this change. Try again; if this project changed elsewhere, reload it first.'
      )
      return false
    }
  }
  if (projectQuery.isLoading) return <LoadingState label="Loading project" />
  if (!project || projectQuery.isError)
    return (
      <ErrorState
        message="This project could not be loaded. It may no longer be available."
        retry={() => void projectQuery.refetch()}
      />
    )
  const availableNotes =
    notes.data?.filter((note) => !project.notes.some((linked) => linked.id === note.id)) ?? []
  return (
    <div className="space-y-8">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        All projects
      </Link>
      <PageHeader
        eyebrow={`${project.context} project`}
        title={project.title}
        description={
          project.outcome ||
          'What would a meaningful finish look like? Add an outcome to guide your next step.'
        }
      >
        <Button variant="outline" onClick={() => setEditing(true)}>
          Edit project
        </Button>
        {project.status === 'archived' ? (
          <Button
            variant="outline"
            disabled={update.isPending}
            onClick={() => void change({ status: 'active' })}
          >
            Restore project
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => setArchiving(true)}>
            Archive project
          </Button>
        )}
      </PageHeader>
      <div className="flex flex-wrap items-center gap-4">
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium capitalize">
          {project.status === 'archived' ? 'Archived' : project.status}
        </span>
        <span className="text-sm text-muted-foreground">
          {project.completedTaskCount} of {project.taskCount} actions complete
        </span>
        {project.goalId && (
          <Link className="text-sm text-primary hover:underline" href={`/goals/${project.goalId}`}>
            Open growth goal <ArrowRight className="inline h-3 w-3" />
          </Link>
        )}
        {project.status !== 'archived' && (
          <Select
            className="sm:ml-auto sm:w-44"
            aria-label="Project progress"
            value={project.status}
            disabled={update.isPending}
            onChange={(e) =>
              void change({ status: e.target.value as 'active' | 'paused' | 'completed' })
            }
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </Select>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <section
            className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8"
            aria-labelledby="next-step-heading"
          >
            <p className="eyebrow text-primary">Keep it moving</p>
            <h2 id="next-step-heading" className="mt-3 text-xl font-semibold">
              One clear next step.
            </h2>
            {project.nextAction ? (
              <Link
                href={`/tasks/${project.nextAction.id}`}
                className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-card/80 p-4 text-lg font-medium hover:bg-card"
              >
                {project.nextAction.title}
                <ArrowUpRightIcon />
              </Link>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Choose something small enough to begin.
              </p>
            )}
            <div className="mt-5">
              <label htmlFor="existing-next" className="mb-2 block text-xs text-muted-foreground">
                Choose an existing action
              </label>
              <Select
                id="existing-next"
                value={project.nextActionId ?? ''}
                disabled={update.isPending}
                onChange={(e) => void change({ nextActionId: e.target.value || null })}
              >
                <option value="">No next action selected</option>
                {project.tasks
                  .filter((task) => task.status === 'pending' || task.status === 'in_progress')
                  .map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
              </Select>
            </div>
            <form
              className="mt-5 space-y-2"
              onSubmit={async (event) => {
                event.preventDefault()
                if (adding.current || !title.trim()) return
                adding.current = true
                setError('')
                if (!submission.current || submission.current.title !== title.trim())
                  submission.current = { title: title.trim(), id: crypto.randomUUID() }
                try {
                  await addAction.mutateAsync({
                    id,
                    title: submission.current.title,
                    submissionId: submission.current.id,
                  })
                  setTitle('')
                  submission.current = null
                } catch {
                  setError(
                    'Could not add this action. Your text is kept; retrying will not duplicate it.'
                  )
                } finally {
                  adding.current = false
                }
              }}
            >
              <label htmlFor="new-next-action" className="text-sm font-medium">
                Next action
              </label>
              <div className="flex flex-wrap gap-2">
                <Input
                  id="new-next-action"
                  value={title}
                  maxLength={500}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Start with a verb…"
                  className="min-w-0 flex-1"
                />
                <Button
                  type="submit"
                  disabled={addAction.isPending || !title.trim()}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add action
                </Button>
              </div>
            </form>
          </section>
          <section className="surface overflow-hidden p-4 sm:p-6" aria-labelledby="actions-heading">
            <h2 id="actions-heading" className="mb-4 text-lg font-semibold">
              Actions & history
            </h2>
            <TaskList tasks={project.tasks} />
          </section>
        </div>
        <section className="surface min-w-0 p-6" aria-labelledby="project-notes-heading">
          <span className="mb-4 inline-flex rounded-2xl bg-secondary p-3 text-primary">
            <FileText className="h-5 w-5" />
          </span>
          <h2 id="project-notes-heading" className="text-lg font-semibold">
            Supporting notes
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Keep thinking, decisions and useful context close to the work.
          </p>
          <ul className="my-5 space-y-2">
            {project.notes.map((note) => (
              <li
                key={note.id}
                data-testid={`project-note-${note.id}`}
                className="flex items-center gap-2 rounded-xl bg-muted/50 p-3"
              >
                <Link
                  className="min-w-0 flex-1 truncate text-sm hover:text-primary"
                  href={`/notes/${note.id}`}
                >
                  {note.title || 'Untitled note'}
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Unlink ${note.title || 'Untitled note'}`}
                  disabled={update.isPending}
                  onClick={() =>
                    void change({
                      noteIds: project.notes
                        .filter((item) => item.id !== note.id)
                        .map((item) => item.id),
                    })
                  }
                >
                  Unlink
                </Button>
              </li>
            ))}
          </ul>
          {!project.notes.length && (
            <p className="mb-5 text-sm text-muted-foreground">No notes linked yet.</p>
          )}
          <div className="space-y-3">
            <Input
              aria-label="Find notes to link"
              placeholder="Find a note…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setNoteId('')
              }}
            />
            <Select
              aria-label="Note to link"
              value={noteId}
              onChange={(e) => setNoteId(e.target.value)}
            >
              <option value="">Choose a note</option>
              {availableNotes.map((note) => (
                <option key={note.id} value={note.id}>
                  {note.title || 'Untitled note'}
                </option>
              ))}
            </Select>
            <Button
              variant="outline"
              disabled={!noteId || update.isPending}
              onClick={async () => {
                if (await change({ noteIds: [...project.notes.map((note) => note.id), noteId] }))
                  setNoteId('')
              }}
            >
              Link note
            </Button>
            {notes.isError && (
              <p role="alert" className="text-sm text-destructive">
                Notes could not load.{' '}
                <button className="underline" onClick={() => void notes.refetch()}>
                  Retry notes
                </button>
              </p>
            )}
          </div>
        </section>
      </div>
      <Dialog open={editing} onClose={() => setEditing(false)} title="Edit project">
        <ProjectForm
          initial={project}
          label="Save project"
          onSave={async (data) => {
            await save(data)
            setEditing(false)
          }}
        />
      </Dialog>
      <Dialog
        open={archiving}
        onClose={() => setArchiving(false)}
        title="Archive this project?"
        description="Your actions, notes and progress stay available. You can restore this project whenever you need it."
      >
        <Button
          disabled={update.isPending}
          onClick={async () => {
            if (await change({ status: 'archived' })) setArchiving(false)
          }}
        >
          Archive
        </Button>
      </Dialog>
    </div>
  )
}

function ArrowUpRightIcon() {
  return <ArrowRight aria-hidden className="h-5 w-5 shrink-0 -rotate-45 text-primary" />
}
