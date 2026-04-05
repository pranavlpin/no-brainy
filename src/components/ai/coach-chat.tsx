'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles } from 'lucide-react'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { streamAIResponse } from '@/lib/ai/stream-client'
import type { CoachMessage } from '@/lib/ai/types'

interface MessageWithMeta {
  message: CoachMessage
  timestamp: Date
}

const SUGGESTED_PROMPTS = [
  'What should I focus on today?',
  'Why am I not completing my tasks?',
  'Summarize my week',
  'What topics should I review?',
]

export function CoachChat() {
  const [messages, setMessages] = useState<MessageWithMeta[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return

      const userMsg: MessageWithMeta = {
        message: { role: 'user', content: content.trim() },
        timestamp: new Date(),
      }

      const updatedMessages = [...messages, userMsg]
      setMessages(updatedMessages)
      setInput('')
      setIsStreaming(true)

      // Prepare assistant placeholder
      const assistantMsg: MessageWithMeta = {
        message: { role: 'assistant', content: '' },
        timestamp: new Date(),
      }

      setMessages([...updatedMessages, assistantMsg])

      try {
        const chatMessages = updatedMessages.map((m) => m.message)
        let accumulated = ''

        for await (const chunk of streamAIResponse('/api/ai/coach', {
          messages: chatMessages,
        })) {
          accumulated += chunk
          setMessages((prev) => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            if (last && last.message.role === 'assistant') {
              updated[updated.length - 1] = {
                ...last,
                message: { ...last.message, content: accumulated },
              }
            }
            return updated
          })
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Something went wrong'
        setMessages((prev) => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last && last.message.role === 'assistant') {
            updated[updated.length - 1] = {
              ...last,
              message: {
                ...last.message,
                content:
                  last.message.content ||
                  `I'm sorry, I encountered an error: ${errorMessage}`,
              },
            }
          }
          return updated
        })
      } finally {
        setIsStreaming(false)
      }
    },
    [messages, isStreaming]
  )

  const handleSend = useCallback(() => {
    sendMessage(input)
  }, [input, sendMessage])

  const handleSuggestion = useCallback(
    (prompt: string) => {
      sendMessage(prompt)
    },
    [sendMessage]
  )

  return (
    <div className="flex h-full flex-col">
      {/* Message area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Sparkles className="h-6 w-6 text-purple-500" />
              </div>
              <h2 className="text-xl font-semibold">NoBrainy Coach</h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                Ask me about your productivity, tasks, notes, or habits. I can
                help you stay focused and organized.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSuggestion(prompt)}
                  className="rounded-xl border bg-background px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <ChatMessage key={i} message={m.message} timestamp={m.timestamp} />
          ))
        )}
      </div>

      {/* Input area */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        isStreaming={isStreaming}
      />
    </div>
  )
}
