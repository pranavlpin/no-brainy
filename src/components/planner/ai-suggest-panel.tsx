"use client"

import { Button } from "@/components/ui/button"
import { MarkdownPreview } from "@/components/editor/markdown-preview"
import { CheckCircle2, X, Sparkles } from "lucide-react"
import { PriorityBadge } from "@/components/tasks/priority-badge"
import type { DailyPlanSuggestion } from "@/lib/ai/types"
import type { TaskResponse } from "@/lib/types/tasks"

interface AISuggestPanelProps {
  suggestion: DailyPlanSuggestion
  allTasks: TaskResponse[]
  onAccept: (taskIds: string[], briefMd: string) => void
  onDismiss: () => void
}

export function AISuggestPanel({
  suggestion,
  allTasks,
  onAccept,
  onDismiss,
}: AISuggestPanelProps) {
  // Resolve suggested task IDs to full task objects
  const suggestedTasks = suggestion.suggestedTaskIds
    .map((id) => allTasks.find((t) => t.id === id))
    .filter((t): t is TaskResponse => t !== undefined)

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">AI Suggestion</h3>
        </div>
        <button
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Morning Brief */}
      <div className="rounded-md border bg-card">
        <MarkdownPreview content={suggestion.briefMd} />
      </div>

      {/* Suggested Tasks */}
      {suggestedTasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Suggested Focus Tasks
          </p>
          <div className="space-y-2">
            {suggestedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-md border bg-card p-3"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{task.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <PriorityBadge priority={task.priority} />
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground">
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reasoning */}
      <p className="text-xs text-muted-foreground">{suggestion.reasoning}</p>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          onClick={() =>
            onAccept(suggestion.suggestedTaskIds, suggestion.briefMd)
          }
        >
          Accept Suggestions
        </Button>
        <Button size="sm" variant="outline" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
