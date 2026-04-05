'use client'

import { useRef, useCallback, type KeyboardEvent, type ChangeEvent } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  isStreaming: boolean
}

export function ChatInput({ value, onChange, onSend, isStreaming }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (value.trim() && !isStreaming) {
          onSend()
          // Reset height after sending
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
          }
        }
      }
    },
    [value, isStreaming, onSend]
  )

  const canSend = value.trim().length > 0 && !isStreaming

  return (
    <div className="border-t bg-background p-4">
      {isStreaming && (
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          AI is typing...
        </div>
      )}
      <div className="flex items-end gap-2">
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
          onClick={() => {
            if (canSend) {
              onSend()
              if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
              }
            }
          }}
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
