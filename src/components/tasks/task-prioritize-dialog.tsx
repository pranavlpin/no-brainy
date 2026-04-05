'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, ArrowRight } from 'lucide-react'
import { useUpdateTask } from '@/hooks/use-tasks'
import type { PrioritySuggestion, TaskPrioritizationResult } from '@/lib/ai/types'
import type { TaskPriority } from '@/lib/types/tasks'

const priorityColors: Record<string, 'red' | 'orange' | 'blue' | 'gray'> = {
  urgent: 'red',
  high: 'orange',
  medium: 'blue',
  low: 'gray',
}

interface TaskPrioritizeDialogProps {
  result: TaskPrioritizationResult
  onClose: () => void
}

export function TaskPrioritizeDialog({ result, onClose }: TaskPrioritizeDialogProps) {
  const [accepted, setAccepted] = useState<Set<string>>(new Set())
  const updateTask = useUpdateTask()

  const pendingSuggestions = result.suggestions.filter(
    (s) => !accepted.has(s.taskId)
  )

  const handleAccept = useCallback(
    (suggestion: PrioritySuggestion) => {
      updateTask.mutate(
        {
          id: suggestion.taskId,
          data: { priority: suggestion.suggestedPriority as TaskPriority },
        },
        {
          onSuccess: () => {
            setAccepted((prev) => new Set(prev).add(suggestion.taskId))
          },
        }
      )
    },
    [updateTask]
  )

  const handleAcceptAll = useCallback(() => {
    for (const suggestion of pendingSuggestions) {
      updateTask.mutate(
        {
          id: suggestion.taskId,
          data: { priority: suggestion.suggestedPriority as TaskPriority },
        },
        {
          onSuccess: () => {
            setAccepted((prev) => new Set(prev).add(suggestion.taskId))
          },
        }
      )
    }
  }, [pendingSuggestions, updateTask])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-lg bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">AI Priority Suggestions</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Overall reasoning */}
        <p className="text-sm text-muted-foreground mb-6">{result.reasoning}</p>

        {result.suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Your current priorities look good -- no changes suggested.
          </p>
        ) : (
          <>
            {/* Actions bar */}
            {pendingSuggestions.length > 0 && (
              <div className="flex justify-end mb-4">
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                  disabled={updateTask.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept All ({pendingSuggestions.length})
                </Button>
              </div>
            )}

            {/* Suggestions table */}
            <div className="space-y-3">
              {result.suggestions.map((suggestion) => {
                const isAccepted = accepted.has(suggestion.taskId)
                return (
                  <div
                    key={suggestion.taskId}
                    className={`flex items-center gap-3 rounded-md border p-3 ${
                      isAccepted ? 'opacity-50 bg-muted' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {suggestion.taskTitle ?? suggestion.taskId}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {suggestion.reason}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={priorityColors[suggestion.currentPriority] || 'gray'}>
                        {suggestion.currentPriority}
                      </Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge variant={priorityColors[suggestion.suggestedPriority] || 'gray'}>
                        {suggestion.suggestedPriority}
                      </Badge>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isAccepted || updateTask.isPending}
                      onClick={() => handleAccept(suggestion)}
                    >
                      {isAccepted ? 'Applied' : 'Accept'}
                    </Button>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  )
}
