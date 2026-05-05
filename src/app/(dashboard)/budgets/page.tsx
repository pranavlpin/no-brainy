'use client'

import { useState } from 'react'
import { Plus, Sparkles, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BudgetCard } from '@/components/expenses/budget-card'
import { BudgetForm } from '@/components/expenses/budget-form'
import { useBudgets, useCreateBudget, useDeleteBudget } from '@/hooks/use-budgets'
import { useAI } from '@/hooks/use-ai'
import { apiClient } from '@/lib/api-client'
import type { CreateBudgetRequest } from '@/lib/types/budgets'

export default function BudgetsPage(): React.ReactElement {
  const [showForm, setShowForm] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const { data: budgets, isLoading } = useBudgets()
  const createBudget = useCreateBudget()
  const deleteBudget = useDeleteBudget()
  const { isEnabled: aiEnabled } = useAI()

  const handleCreate = (data: CreateBudgetRequest): void => {
    createBudget.mutate(data, {
      onSuccess: () => setShowForm(false),
    })
  }

  const handleDelete = (id: string): void => {
    if (confirm('Delete this budget?')) {
      deleteBudget.mutate(id)
    }
  }

  const handleAIAnalysis = async (): Promise<void> => {
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await apiClient<{ success: true; data: { analysis: string } }>('/api/budgets/ai', {
        method: 'POST',
      })
      setAiAnalysis(res.data.analysis)
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'error' in err
        ? (err as { error: { message: string } }).error.message
        : 'Failed to analyze budgets'
      setAiError(message)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-retro-dark">Budgets</h1>
        <div className="flex items-center gap-2">
          {aiEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAIAnalysis}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              {aiLoading ? 'Analyzing...' : 'AI Advice'}
            </Button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="border-2 border-retro-dark bg-retro-blue px-4 py-2 font-mono text-sm font-bold text-white shadow-hard hover-shadow-grow"
          >
            <Plus className="mr-2 inline h-4 w-4" />
            New Budget
          </button>
        </div>
      </div>

      {/* AI Analysis Panel */}
      {(aiAnalysis || aiError) && (
        <div className="border-2 border-retro-blue/20 bg-retro-blue/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-retro-blue" />
              <span className="font-mono text-xs uppercase tracking-wider text-retro-dark/60">AI Budget Advice</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleAIAnalysis} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Refresh'}
              </Button>
              <button onClick={() => { setAiAnalysis(null); setAiError(null) }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {aiError && <p className="text-sm text-red-500">{aiError}</p>}
          {aiAnalysis && (
            <div
              className="prose prose-sm max-w-none text-retro-dark/80 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:text-sm [&_strong]:text-retro-dark [&_h2]:text-base [&_h3]:text-sm"
              dangerouslySetInnerHTML={{
                __html: aiAnalysis
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/^- (.*$)/gm, '<li>$1</li>')
                  .replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>')
                  .replace(/\n\n/g, '<br/><br/>')
                  .replace(/\n/g, '<br/>'),
              }}
            />
          )}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <BudgetForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isPending={createBudget.isPending}
        />
      )}

      {/* Budget cards grid */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading budgets...</div>
      ) : budgets && budgets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={() => {}}
              onDelete={() => handleDelete(budget.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-retro-dark/20 py-16 text-center">
          <p className="font-mono text-sm text-muted-foreground">
            No budgets yet. Set spending limits or savings targets to track your finances.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 border-2 border-retro-dark/20 bg-white px-4 py-2 font-mono text-sm font-bold text-retro-dark hover:bg-muted"
          >
            <Plus className="mr-2 inline h-4 w-4" />
            Create First Budget
          </button>
        </div>
      )}
    </div>
  )
}
