'use client'

import { useState } from 'react'
import { AIActionButton } from '@/components/ai/ai-action-button'
import { TaskPrioritizeDialog } from '@/components/tasks/task-prioritize-dialog'
import { useTaskPrioritize } from '@/hooks/use-task-ai'
import type { TaskPrioritizationResult } from '@/lib/ai/types'

export function TaskAIPanel() {
  const [result, setResult] = useState<TaskPrioritizationResult | null>(null)
  const prioritize = useTaskPrioritize()

  const handlePrioritize = () => {
    prioritize.mutate({}, {
      onSuccess: (response) => {
        setResult(response.data)
      },
    })
  }

  return (
    <>
      <AIActionButton
        label="AI Prioritize"
        onClick={handlePrioritize}
        isLoading={prioritize.isPending}
      />

      {result && (
        <TaskPrioritizeDialog
          result={result}
          onClose={() => setResult(null)}
        />
      )}
    </>
  )
}
