'use client'

import { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from 'react'
import { Send, Loader2, Paperclip, X, Wallet, CheckSquare, FileText, Layers, Target, PiggyBank } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

const CONTEXT_MODULES: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'expenses', label: 'Expenses', icon: Wallet },
  { key: 'budgets', label: 'Budgets', icon: PiggyBank },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare },
  { key: 'goals', label: 'Goals', icon: Target },
  { key: 'notes', label: 'Notes', icon: FileText },
  { key: 'flashcards', label: 'Flashcards', icon: Layers },
]

export interface ContextAttachment {
  modules: string[]
  dateFrom: string
  dateTo: string
}

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (context?: ContextAttachment) => void
  isStreaming: boolean
}

export function ChatInput({ value, onChange, onSend, isStreaming }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showContextPicker, setShowContextPicker] = useState(false)
  const [selectedModules, setSelectedModules] = useState<string[]>(['expenses', 'tasks', 'budgets'])
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [contextAttached, setContextAttached] = useState(false)

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }, [])

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
      adjustHeight()
    },
    [onChange, adjustHeight]
  )

  const handleSend = useCallback(() => {
    if (!value.trim() || isStreaming) return
    const context = contextAttached
      ? { modules: selectedModules, dateFrom, dateTo }
      : undefined
    onSend(context)
    setContextAttached(false)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [value, isStreaming, contextAttached, selectedModules, dateFrom, dateTo, onSend])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const toggleModule = (key: string): void => {
    setSelectedModules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const canSend = value.trim().length > 0 && !isStreaming

  return (
    <div className="border-t bg-background p-4">
      {isStreaming && (
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          AI is typing...
        </div>
      )}

      {/* Context attached indicator */}
      {contextAttached && (
        <div className="mb-2 flex items-center gap-2 rounded bg-retro-blue/5 px-3 py-1.5 text-xs">
          <Paperclip className="h-3 w-3 text-retro-blue" />
          <span className="text-retro-dark/60">
            Context: {selectedModules.length} modules ({dateFrom} to {dateTo})
          </span>
          <button onClick={() => setContextAttached(false)} className="ml-auto text-retro-dark/40 hover:text-retro-dark">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Context picker popup */}
      {showContextPicker && (
        <div className="mb-3 border-2 border-retro-dark/15 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-retro-dark/60">Attach Data Context</span>
            <button onClick={() => setShowContextPicker(false)} className="text-retro-dark/40 hover:text-retro-dark">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {CONTEXT_MODULES.map((mod) => {
              const Icon = mod.icon
              const selected = selectedModules.includes(mod.key)
              return (
                <button
                  key={mod.key}
                  onClick={() => toggleModule(mod.key)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 text-xs border transition-colors ${
                    selected ? 'border-retro-blue bg-retro-blue/5 text-retro-dark' : 'border-retro-dark/10 text-retro-dark/40'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {mod.label}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="flex-1 h-8 text-xs" />
            <span className="text-xs text-retro-dark/40">to</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="flex-1 h-8 text-xs" />
          </div>
          <button
            onClick={() => { setContextAttached(true); setShowContextPicker(false) }}
            disabled={selectedModules.length === 0}
            className="w-full border-2 border-retro-dark bg-retro-blue px-3 py-1.5 font-mono text-xs font-bold text-white disabled:opacity-50"
          >
            Attach {selectedModules.length} module{selectedModules.length !== 1 ? 's' : ''} as context
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={() => setShowContextPicker(!showContextPicker)}
          className={`h-11 w-11 shrink-0 flex items-center justify-center rounded-xl border ${
            contextAttached ? 'border-retro-blue bg-retro-blue/10 text-retro-blue' : 'border-border text-muted-foreground hover:text-foreground'
          }`}
          title="Attach data context"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask your AI coach..."
          rows={1}
          className={cn(
            'flex-1 resize-none rounded-xl border bg-muted/50 px-4 py-3 text-sm',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
          disabled={isStreaming}
        />
        <Button
          size="default"
          onClick={handleSend}
          disabled={!canSend}
          className="h-11 w-11 shrink-0 rounded-xl p-0"
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
