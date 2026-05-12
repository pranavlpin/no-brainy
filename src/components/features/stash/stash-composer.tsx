'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, Link as LinkIcon } from 'lucide-react'
import { useSendMessage } from '@/hooks/use-stash'
import { isHttpUrl, getHostname } from '@/lib/stash/url'

interface StashComposerProps {
  channelId: string
}

export function StashComposer({ channelId }: StashComposerProps) {
  const [content, setContent] = useState('')
  const [label, setLabel] = useState('')
  const [showLabel, setShowLabel] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const send = useSendMessage(channelId)

  const linkDetected = useMemo(() => isHttpUrl(content), [content])

  // Reset state when switching channels
  useEffect(() => {
    setContent('')
    setLabel('')
    setShowLabel(false)
  }, [channelId])

  const handleSend = async () => {
    const trimmed = content.trim()
    const trimmedLabel = label.trim()
    if (trimmed.length === 0 && trimmedLabel.length === 0) return
    try {
      if (linkDetected) {
        await send.mutateAsync({
          type: 'LINK',
          linkUrl: trimmed,
          label: trimmedLabel || undefined,
        })
      } else {
        await send.mutateAsync({
          type: 'TEXT',
          content: trimmed,
          label: trimmedLabel || undefined,
        })
      }
      setContent('')
      setLabel('')
      setShowLabel(false)
      textareaRef.current?.focus()
    } catch {
      // surface via toast in a later slice
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-border bg-background p-3">
      {showLabel && (
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional, e.g. 'Gmail account')"
          maxLength={200}
          className="mb-2 w-full border-2 border-retro-dark/20 bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-retro-blue"
        />
      )}
      {linkDetected && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-retro-blue">
          <LinkIcon className="h-3 w-3" />
          <span>Will save as link · {getHostname(content)}</span>
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => setShowLabel((s) => !s)}
          className="h-10 shrink-0 px-2 text-xs text-muted-foreground hover:text-retro-blue"
          title="Toggle label"
        >
          {showLabel ? '−label' : '+label'}
        </button>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message or paste a URL… (Cmd/Ctrl+Enter to send)"
          rows={1}
          maxLength={50_000}
          className="flex max-h-40 min-h-10 w-full resize-none border-2 border-retro-dark/20 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-retro-blue"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={send.isPending || (content.trim().length === 0 && label.trim().length === 0)}
          className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-retro-dark bg-retro-blue text-white shadow-hard transition-transform hover-shadow-grow disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
