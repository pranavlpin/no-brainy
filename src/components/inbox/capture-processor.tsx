'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useProjects } from '@/hooks/use-projects'
import { useProcessCapture } from '@/hooks/use-inbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  captureDestination,
  type CaptureResponse,
  type ProcessCaptureInput,
} from '@/lib/types/inbox'

/** Process one preserved capture; errors retain form values and save-next is keyboard accessible. */
export function CaptureProcessor({
  capture,
  onDone,
}: {
  capture: CaptureResponse
  onDone: (capture: CaptureResponse) => void
}) {
  const [kind, setKind] = useState<ProcessCaptureInput['kind']>('task')
  const [title, setTitle] = useState(capture.content.split('\n')[0].slice(0, 200))
  const [projectId, setProjectId] = useState('')
  const [url, setUrl] = useState(capture.sourceUrl ?? '')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const lock = useRef(false)
  const projects = useProjects()
  const process = useProcessCapture()
  const destination = captureDestination(capture)
  return (
    <form
      className="space-y-5"
      data-testid={`process-${capture.id}`}
      onSubmit={async (event) => {
        event.preventDefault()
        if (lock.current) return
        lock.current = true
        setPending(true)
        setError('')
        try {
          onDone(
            await process.mutateAsync({
              id: capture.id,
              kind,
              ...(kind !== 'someday' && { title }),
              ...((kind === 'task' || kind === 'note') && { projectId: projectId || null }),
              ...(kind === 'bookmark' && { url }),
            })
          )
        } catch {
          setError('Could not finish processing. Your original and choices are kept; try again.')
        } finally {
          lock.current = false
          setPending(false)
        }
      }}
    >
      <div className="rounded-2xl bg-muted/60 p-4">
        <span className="eyebrow">Original capture</span>
        <p className="mt-3 max-h-44 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-6">
          {capture.content}
        </p>
        {capture.sourceUrl && (
          <a
            href={capture.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm text-primary underline"
          >
            Original source
          </a>
        )}
      </div>
      {destination ? (
        <div className="rounded-xl border bg-primary/5 p-4 text-sm leading-6">
          This capture already has a saved result. Reprocessing keeps that result and its edits.{' '}
          <Link className="text-primary underline" href={destination}>
            Open {capture.destinationType}
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-2 text-sm font-medium">
            <label htmlFor="capture-kind">Save as</label>
            <Select
              id="capture-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as ProcessCaptureInput['kind'])}
              disabled={pending}
            >
              <option value="task">An action</option>
              <option value="note">A note</option>
              <option value="bookmark">A reference link</option>
              <option value="someday">Someday</option>
            </Select>
          </div>
          {kind !== 'someday' && (
            <label className="block space-y-2 text-sm font-medium">
              Title
              <Input
                value={title}
                maxLength={500}
                required
                onChange={(event) => setTitle(event.target.value)}
                disabled={pending}
              />
            </label>
          )}
          {(kind === 'task' || kind === 'note') && (
            <div className="space-y-2">
              <label htmlFor="capture-project" className="text-sm font-medium">
                Project
              </label>
              <Select
                id="capture-project"
                aria-describedby="capture-project-help"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                disabled={pending}
              >
                <option value="">No project</option>
                {projects.data?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </Select>
              <p id="capture-project-help" className="text-xs text-muted-foreground">
                Optional. Actions become the project’s next step; notes become supporting context.
              </p>
            </div>
          )}
          {kind === 'bookmark' && (
            <label className="block space-y-2 text-sm font-medium">
              Reference URL
              <Input
                type="url"
                required
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                disabled={pending}
                placeholder="https://example.com"
              />
            </label>
          )}
          {kind === 'someday' && (
            <p className="text-sm leading-6 text-muted-foreground">
              Keep the possibility without adding a commitment. You can return to it whenever it
              feels useful.
            </p>
          )}
        </>
      )}
      {projects.isError && (
        <p role="alert" className="text-sm text-destructive">
          Projects could not load.{' '}
          <button type="button" className="underline" onClick={() => void projects.refetch()}>
            Retry projects
          </button>
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Saving…' : 'Save & next'}
      </Button>
    </form>
  )
}
