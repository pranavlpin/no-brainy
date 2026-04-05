'use client'

import { Bot, User } from 'lucide-react'
import { MarkdownPreview } from '@/components/editor/markdown-preview'
import { cn } from '@/lib/utils'
import type { CoachMessage } from '@/lib/ai/types'

interface ChatMessageProps {
  message: CoachMessage
  timestamp?: Date
}

export function ChatMessage({ message, timestamp }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl',
          isUser
            ? 'bg-primary text-primary-foreground px-4 py-2.5'
            : 'bg-muted'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        ) : (
          <MarkdownPreview
            content={message.content}
            className="p-2.5 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5"
          />
        )}
        {timestamp && (
          <p
            className={cn(
              'mt-1 text-[10px]',
              isUser ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground px-2.5 pb-1'
            )}
          >
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  )
}
