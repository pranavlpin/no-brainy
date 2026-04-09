'use client'

import { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import { AIActionButton } from '@/components/ai/ai-action-button'
import { InsightCard } from '@/components/insights/insight-card'
import { useInsights, useGenerateInsights, useDismissInsight } from '@/hooks/use-insights'

const insightTypes = [
  { value: '', label: 'All Types' },
  { value: 'procrastination', label: 'Procrastination' },
  { value: 'workload', label: 'Workload' },
  { value: 'priority', label: 'Priority' },
  { value: 'streak', label: 'Streak' },
  { value: 'gap', label: 'Knowledge Gap' },
  { value: 'time', label: 'Time Patterns' },
  { value: 'topic', label: 'Topics' },
]

export default function InsightsPage() {
  const [typeFilter, setTypeFilter] = useState('')
  const [showDismissed, setShowDismissed] = useState(false)

  const { data, isLoading } = useInsights({
    dismissed: showDismissed,
    type: typeFilter || undefined,
  })

  const generateInsights = useGenerateInsights()
  const dismissInsight = useDismissInsight()

  const insights = data?.insights ?? []

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
          onClick={() => generateInsights.mutate()}
          isLoading={generateInsights.isPending}
          size="default"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-none border border-border bg-background px-3 py-1.5 text-sm font-mono"
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
            className="rounded border-border"
          />
          Show dismissed
        </label>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg border border-border bg-muted" />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <Lightbulb className="mb-3 h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-lg font-medium text-foreground">No insights yet</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Click &quot;Generate Insights&quot; to analyze your productivity data and surface actionable patterns.
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
    </div>
  )
}
