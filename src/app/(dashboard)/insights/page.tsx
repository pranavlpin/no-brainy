'use client'

import { useState } from 'react'
import {
  Lightbulb, Wallet, CheckSquare, FileText, Layers, Target, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AIActionButton } from '@/components/ai/ai-action-button'
import { InsightCard } from '@/components/insights/insight-card'
import { useInsights, useGenerateInsights, useDismissInsight } from '@/hooks/use-insights'
import type { LucideIcon } from 'lucide-react'

const MODULES: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'expenses', label: 'Expenses', icon: Wallet },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare },
  { key: 'notes', label: 'Notes', icon: FileText },
  { key: 'flashcards', label: 'Flashcards', icon: Layers },
  { key: 'habits', label: 'Habits', icon: Target },
]

const insightTypes = [
  { value: '', label: 'All Types' },
  { value: 'procrastination', label: 'Procrastination' },
  { value: 'workload', label: 'Workload' },
  { value: 'priority', label: 'Priority' },
  { value: 'streak', label: 'Streak' },
  { value: 'gap', label: 'Knowledge Gap' },
  { value: 'time', label: 'Time Patterns' },
  { value: 'topic', label: 'Topics' },
  { value: 'spending', label: 'Spending' },
  { value: 'budget', label: 'Budget' },
  { value: 'category_trend', label: 'Category Trend' },
]

export default function InsightsPage(): React.ReactElement {
  const [typeFilter, setTypeFilter] = useState('')
  const [showDismissed, setShowDismissed] = useState(false)
  const [showModuleSelector, setShowModuleSelector] = useState(false)
  const [selectedModules, setSelectedModules] = useState<string[]>(
    MODULES.map((m) => m.key)
  )

  const { data, isLoading } = useInsights({
    dismissed: showDismissed,
    type: typeFilter || undefined,
  })

  const generateInsights = useGenerateInsights()
  const dismissInsight = useDismissInsight()

  const insights = data?.insights ?? []

  const toggleModule = (key: string): void => {
    setSelectedModules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const handleGenerate = (): void => {
    generateInsights.mutate(selectedModules)
    setShowModuleSelector(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-7 w-7 text-yellow-500" />
          <h1 className="font-display text-2xl font-bold text-retro-dark">Insights</h1>
        </div>
        <AIActionButton
          label="Generate Insights"
          onClick={() => setShowModuleSelector(true)}
          isLoading={generateInsights.isPending}
          size="default"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border-2 border-retro-dark/20 bg-background px-3 py-1.5 text-sm font-mono"
        >
          {insightTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showDismissed}
            onChange={(e) => setShowDismissed(e.target.checked)}
            className="border-retro-dark/30"
          />
          Show dismissed
        </label>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 border-2 border-retro-dark/10 bg-muted" />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-retro-dark/20 py-16 text-center">
          <Lightbulb className="mb-3 h-12 w-12 text-muted-foreground/50" />
          <h2 className="font-display text-lg font-medium text-foreground">No insights yet</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Click &quot;Generate Insights&quot; to analyze your data and surface actionable patterns.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              id={insight.id}
              insightType={insight.insightType}
              contentMd={insight.contentMd}
              severity={insight.severity}
              generatedAt={insight.generatedAt}
              onDismiss={(id) => dismissInsight.mutate(id)}
              isDismissing={dismissInsight.isPending}
            />
          ))}
        </div>
      )}

      {/* Module Selector Dialog */}
      {showModuleSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModuleSelector(false)} />
          <div className="relative z-50 w-full max-w-md border-2 border-retro-dark bg-white p-6 shadow-hard">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-retro-dark">Select Modules</h2>
              <button onClick={() => setShowModuleSelector(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Choose which modules to analyze. Only selected modules will be queried, saving your AI tokens.
            </p>
            <div className="space-y-2">
              {MODULES.map((mod) => {
                const isSelected = selectedModules.includes(mod.key)
                const Icon = mod.icon
                return (
                  <button
                    key={mod.key}
                    onClick={() => toggleModule(mod.key)}
                    className={`flex w-full items-center gap-3 border-2 p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-retro-blue bg-retro-blue/5 text-retro-dark'
                        : 'border-retro-dark/15 bg-white text-retro-dark/40 hover:border-retro-dark/30'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-retro-blue' : 'text-retro-dark/30'}`} />
                    <span className="font-mono text-sm font-medium">{mod.label}</span>
                    {isSelected && (
                      <span className="ml-auto text-xs text-retro-blue font-mono">Selected</span>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => {
                  if (selectedModules.length === MODULES.length) {
                    setSelectedModules([])
                  } else {
                    setSelectedModules(MODULES.map((m) => m.key))
                  }
                }}
                className="font-mono text-xs text-retro-blue hover:underline"
              >
                {selectedModules.length === MODULES.length ? 'Deselect All' : 'Select All'}
              </button>
              <Button
                onClick={handleGenerate}
                disabled={selectedModules.length === 0 || generateInsights.isPending}
              >
                {generateInsights.isPending
                  ? 'Generating...'
                  : `Generate from ${selectedModules.length} module${selectedModules.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
