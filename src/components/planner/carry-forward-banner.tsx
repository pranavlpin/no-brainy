"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PriorityBadge } from "@/components/tasks/priority-badge"
import { AlertCircle, ChevronDown, ChevronUp, Plus } from "lucide-react"
import type { TaskResponse } from "@/lib/types/tasks"

interface CarryForwardBannerProps {
  suggestions: TaskResponse[]
  currentFocusIds: string[]
  onAddToFocus: (taskIds: string[]) => void
}

export function CarryForwardBanner({
  suggestions,
  currentFocusIds,
  onAddToFocus,
}: CarryForwardBannerProps) {
  const [expanded, setExpanded] = useState(false)

  if (suggestions.length === 0) return null

  const addableTasks = suggestions.filter(
    (t) => !currentFocusIds.includes(t.id)
  )

  const handleAddAll = () => {
    const slotsAvailable = 3 - currentFocusIds.length
    const idsToAdd = addableTasks.slice(0, slotsAvailable).map((t) => t.id)
    if (idsToAdd.length > 0) {
      onAddToFocus([...currentFocusIds, ...idsToAdd])
    }
  }

  const handleAddOne = (taskId: string) => {
    if (currentFocusIds.length >= 3) return
    onAddToFocus([...currentFocusIds, taskId])
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {suggestions.length} incomplete task{suggestions.length !== 1 ? "s" : ""} from
            yesterday
          </span>
        </div>
        <div className="flex items-center gap-2">
          {addableTasks.length > 0 && currentFocusIds.length < 3 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddAll}
              className="h-7 text-xs"
            >
              <Plus className="mr-1 h-3 w-3" />
              Add all
            </Button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2">
          {suggestions.map((task) => {
            const alreadyAdded = currentFocusIds.includes(task.id)
            return (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-md bg-background/80 px-3 py-2"
              >
                <span className="flex-1 text-sm">{task.title}</span>
                <PriorityBadge priority={task.priority} />
                {!alreadyAdded && currentFocusIds.length < 3 ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddOne(task.id)}
                    className="h-7 text-xs"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                ) : alreadyAdded ? (
                  <span className="text-xs text-muted-foreground">Added</span>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
