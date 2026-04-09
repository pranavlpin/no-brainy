'use client'

import { useState } from 'react'
import { Sparkles, Loader2, X } from 'lucide-react'
import { useAI } from '@/hooks/use-ai'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api-client'

interface AnalysisResult {
  analysis: string
  model?: string
  tokensUsed?: number
}

export function ExpenseAIPanel(): React.ReactElement {
  const { isEnabled } = useAI()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async (): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiClient<{ success: true; data: AnalysisResult }>('/api/expenses/ai', {
        method: 'POST',
      })
      setResult(res.data)
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'error' in err
        ? (err as { error: { message: string } }).error.message
        : 'Failed to analyze expenses'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isEnabled) {
    return (
      <Button variant="outline" size="sm" disabled title="Add your OpenAI API key in Settings to unlock AI features">
        <Sparkles className="h-4 w-4 mr-1 opacity-50" />
        AI Analyze
      </Button>
    )
  }

  if (!result) {
    return (
      <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 mr-1" />
        )}
        {isLoading ? 'Analyzing...' : 'AI Analyze'}
      </Button>
    )
  }

  return (
    <div className="border-2 border-retro-blue/20 bg-retro-blue/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-retro-blue" />
          <span className="font-mono text-xs uppercase tracking-wider text-retro-dark/60">AI Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleAnalyze} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Refresh'}
          </Button>
          <button onClick={() => setResult(null)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-500 mb-2">{error}</p>
      )}
      <div className="prose prose-sm max-w-none text-retro-dark/80 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:text-sm [&_strong]:text-retro-dark [&_h2]:text-base [&_h2]:font-display [&_h3]:text-sm [&_h3]:font-display">
        <div dangerouslySetInnerHTML={{ __html: formatMarkdown(result.analysis) }} />
      </div>
    </div>
  )
}

function formatMarkdown(md: string): string {
  return md
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}
