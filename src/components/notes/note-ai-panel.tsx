'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Sparkles, Plus, X } from 'lucide-react'
import { AIActionButton } from '@/components/ai/ai-action-button'
import { Badge } from '@/components/ui/badge'
import { useAI } from '@/hooks/use-ai'
import { useNoteSummarize, useNoteInsights, useNoteTagSuggestions } from '@/hooks/use-note-ai'
import type { NoteSummary, NoteInsights, TagSuggestions } from '@/lib/ai/types'

interface NoteAIPanelProps {
  noteId: string
  existingTags: string[]
  onAddTag: (tag: string) => void
}

export function NoteAIPanel({ noteId, existingTags, onAddTag }: NoteAIPanelProps) {
  const { isEnabled, isLoading: isCheckingKey } = useAI()

  const [summaryData, setSummaryData] = useState<NoteSummary | null>(null)
  const [insightsData, setInsightsData] = useState<NoteInsights | null>(null)
  const [tagsData, setTagsData] = useState<TagSuggestions | null>(null)

  const [showSummary, setShowSummary] = useState(true)
  const [showInsights, setShowInsights] = useState(true)
  const [showTags, setShowTags] = useState(true)

  const summarize = useNoteSummarize(noteId)
  const insights = useNoteInsights(noteId)
  const tagSuggestions = useNoteTagSuggestions(noteId)

  // Track which tags have been dismissed
  const [dismissedTags, setDismissedTags] = useState<Set<string>>(new Set())

  if (isCheckingKey) return null
  if (!isEnabled) {
    return (
      <div className="rounded-lg border border-dashed p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 opacity-50" />
          <span>Add your OpenAI API key in Settings to unlock AI features for notes.</span>
        </div>
      </div>
    )
  }

  const handleSummarize = () => {
    summarize.mutate(undefined, {
      onSuccess: (res) => {
        setSummaryData(res.data)
        setShowSummary(true)
      },
    })
  }

  const handleInsights = () => {
    insights.mutate(undefined, {
      onSuccess: (res) => {
        setInsightsData(res.data)
        setShowInsights(true)
      },
    })
  }

  const handleTags = () => {
    setDismissedTags(new Set())
    tagSuggestions.mutate(undefined, {
      onSuccess: (res) => {
        setTagsData(res.data)
        setShowTags(true)
      },
    })
  }

  const handleAddTag = (tag: string) => {
    onAddTag(tag)
    setDismissedTags((prev) => new Set(prev).add(tag))
  }

  const handleDismissTag = (tag: string) => {
    setDismissedTags((prev) => new Set(prev).add(tag))
  }

  const visibleTags = tagsData?.tags.filter(
    (t) => !dismissedTags.has(t) && !existingTags.includes(t)
  )

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">AI Actions</h3>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <AIActionButton
          label="Summarize"
          onClick={handleSummarize}
          isLoading={summarize.isPending}
        />
        <AIActionButton
          label="Extract Insights"
          onClick={handleInsights}
          isLoading={insights.isPending}
        />
        <AIActionButton
          label="Suggest Tags"
          onClick={handleTags}
          isLoading={tagSuggestions.isPending}
        />
      </div>

      {/* Summary results */}
      {summaryData && (
        <div className="space-y-2">
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <span>Summary</span>
            {showSummary ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {showSummary && (
            <ul className="space-y-1.5 pl-4">
              {summaryData.bullets.map((bullet, i) => (
                <li key={i} className="list-disc text-sm text-muted-foreground">
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Insights results */}
      {insightsData && (
        <div className="space-y-2">
          <button
            onClick={() => setShowInsights(!showInsights)}
            className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <span>Insights</span>
            {showInsights ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {showInsights && (
            <div className="grid gap-2 sm:grid-cols-2">
              {insightsData.insights.map((insight, i) => (
                <div
                  key={i}
                  className="rounded-md border bg-muted/50 p-3"
                >
                  <h4 className="text-sm font-medium">{insight.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tag suggestions results */}
      {tagsData && visibleTags && visibleTags.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowTags(!showTags)}
            className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <span>Suggested Tags</span>
            {showTags ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {showTags && (
            <div className="flex flex-wrap gap-2">
              {visibleTags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1">
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => handleAddTag(tag)}
                    title={`Add "${tag}" to note tags`}
                  >
                    <Plus className="mr-0.5 h-3 w-3" />
                    {tag}
                  </Badge>
                  <button
                    onClick={() => handleDismissTag(tag)}
                    className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Dismiss"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
