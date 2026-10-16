'use client'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCreateGrowthAction } from '@/hooks/use-growth'
interface ExtractedTask {
  title: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  reason: string
}
/** Edit/select proposed actions, then create them with durable source links and stable retry identities. */
export function ActionItemsPreview({
  tasks: initialTasks,
  sourceType,
  sourceId,
  onClose,
}: {
  tasks: ExtractedTask[]
  sourceType: 'note' | 'book'
  sourceId: string
  onClose: () => void
}) {
  const [tasks, setTasks] = useState(() =>
    initialTasks.map((t) => ({
      ...t,
      id: crypto.randomUUID(),
      selected: true,
      saved: false,
      attempted: false,
    }))
  )
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('')
  const create = useCreateGrowthAction(),
    lock = useRef(false)
  const selected = tasks.filter((t) => t.selected && !t.saved)
  const accept = async () => {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    setMessage('')
    try {
      for (const task of selected) {
        setTasks((current) =>
          current.map((item) => (item.id === task.id ? { ...item, attempted: true } : item))
        )
        await create.mutateAsync({
          clientRequestId: task.id,
          title: task.title,
          description: task.reason,
          priority: task.priority,
          sourceType,
          sourceId,
        })
        setTasks((current) =>
          current.map((item) => (item.id === task.id ? { ...item, saved: true } : item))
        )
      }
      setMessage('Selected actions created with their learning source.')
    } catch {
      setError(
        'Some actions could not be confirmed. Your entries are kept; retrying will not duplicate confirmed actions.'
      )
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  return (
    <section className="surface space-y-5 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Possible next actions</h3>
        <Button variant="ghost" size="sm" disabled={busy} onClick={onClose}>
          Dismiss action preview
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Edit or uncheck any suggestion. Nothing is created until you choose.
      </p>
      <div className="space-y-4">
        {tasks.map((task, index) => (
          <article key={task.id} className="space-y-3 rounded-xl border p-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={task.selected}
                disabled={busy || task.saved || task.attempted}
                aria-label={`Include action ${index + 1}`}
                onChange={(event) =>
                  setTasks((current) =>
                    current.map((item) =>
                      item.id === task.id ? { ...item, selected: event.target.checked } : item
                    )
                  )
                }
              />
              {task.saved ? 'Created' : `Action ${index + 1}`}
            </label>
            <label className="block text-xs text-muted-foreground">
              Action title {index + 1}
              <input
                value={task.title}
                maxLength={500}
                disabled={busy || task.saved || task.attempted}
                onChange={(event) =>
                  setTasks((current) =>
                    current.map((item) =>
                      item.id === task.id ? { ...item, title: event.target.value } : item
                    )
                  )
                }
                className="mt-2 w-full rounded-xl border bg-background p-3 text-sm text-foreground"
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              Priority {index + 1}
              <select
                value={task.priority}
                disabled={busy || task.saved || task.attempted}
                onChange={(event) =>
                  setTasks((current) =>
                    current.map((item) =>
                      item.id === task.id
                        ? { ...item, priority: event.target.value as ExtractedTask['priority'] }
                        : item
                    )
                  )
                }
                className="mt-2 block rounded-xl border bg-background p-2 text-sm text-foreground"
              >
                {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-sm text-muted-foreground">{task.reason}</p>
          </article>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-primary">
          {message}
        </p>
      )}
      <Button
        disabled={busy || !selected.length || selected.some((t) => !t.title.trim())}
        onClick={() => void accept()}
      >
        {busy
          ? 'Creating…'
          : error
            ? 'Retry remaining actions'
            : `Create ${selected.length} Task${selected.length === 1 ? '' : 's'}`}
      </Button>
    </section>
  )
}
