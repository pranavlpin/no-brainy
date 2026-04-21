'use client'

import { useState } from 'react'
import { Loader2, Check, ListTodo, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api-client'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

interface ExtractedTask {
  title: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  reason: string
}

interface ActionItemsPreviewProps {
  tasks: ExtractedTask[]
  sourceType: 'note' | 'book'
  sourceId: string
  onClose: () => void
}

const priorityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
}

export function ActionItemsPreview({
  tasks: initialTasks,
  onClose,
}: ActionItemsPreviewProps) {
  const [tasks, setTasks] = useState(
    initialTasks.map((t) => ({ ...t, selected: true }))
  )
  const [isCreating, setIsCreating] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const selectedCount = tasks.filter((t) => t.selected).length

  const toggleTask = (index: number) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    )
  }

  const handleCreate = async () => {
    const selected = tasks.filter((t) => t.selected)
    if (selected.length === 0) return

    setIsCreating(true)
    setResult(null)

    try {
      const promises = selected.map((task) =>
        apiClient('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({
            title: task.title,
            priority: task.priority,
          }),
        })
      )

      await Promise.all(promises)

      // Link tasks to source (best-effort)
      // Tasks are created but linking depends on task-link API existence

      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setResult(`${selected.length} task${selected.length === 1 ? '' : 's'} created successfully!`)
      setTasks([])
    } catch {
      setResult('Failed to create some tasks. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">Extracted Action Items</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {tasks.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedCount} of {tasks.length} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTasks((prev) => prev.map((t) => ({ ...t, selected: true })))}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTasks((prev) => prev.map((t) => ({ ...t, selected: false })))}
              >
                Deselect All
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {tasks.map((task, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-md border border-border bg-background p-3"
              >
                <button
                  type="button"
                  onClick={() => toggleTask(index)}
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                    task.selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background'
                  )}
                >
                  {task.selected && <Check className="h-3 w-3" />}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{task.title}</span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-medium',
                        priorityColors[task.priority] ?? priorityColors.medium
                      )}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{task.reason}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={selectedCount === 0 || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                `Create ${selectedCount} Task${selectedCount !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </>
      )}

      {result && (
        <p className="text-sm text-muted-foreground">{result}</p>
      )}
    </div>
  )
}
