'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, Link as LinkIcon, Paperclip, Tag, X } from 'lucide-react'
import { useSendMessage } from '@/hooks/use-stash'
import { isHttpUrl, getHostname } from '@/lib/stash/url'
import { isAllowedMime, STASH_MAX_FILE_SIZE } from '@/lib/stash/file-validation'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import type { ApiResponse } from '@/lib/types/api'

interface StashComposerProps {
  channelId: string
}

interface UploadUrlResponse {
  uploadUrl: string
  gcsObject: string
  expiresInSeconds: number
}

export function StashComposer({ channelId }: StashComposerProps) {
  const [content, setContent] = useState('')
  const [label, setLabel] = useState('')
  const [showLabel, setShowLabel] = useState(false)
  const [uploading, setUploading] = useState<{ name: string; size: number } | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const send = useSendMessage(channelId)

  const linkDetected = useMemo(() => isHttpUrl(content), [content])

  useEffect(() => {
    setContent('')
    setLabel('')
    setShowLabel(false)
    setUploading(null)
    setUploadError(null)
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
      /* surfaced via parent later */
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file) return

    setUploadError(null)

    if (file.size > STASH_MAX_FILE_SIZE) {
      setUploadError('File exceeds 10MB limit')
      return
    }

    if (!isAllowedMime(file.type)) {
      setUploadError(`MIME type "${file.type || 'unknown'}" is not allowed`)
      return
    }

    setUploading({ name: file.name, size: file.size })
    try {
      const urlRes = await apiClient<ApiResponse<UploadUrlResponse>>('/api/stash/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          channelId,
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
        }),
      })

      const putRes = await fetch(urlRes.data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })
      if (!putRes.ok) {
        throw new Error(`Upload failed (${putRes.status})`)
      }

      await send.mutateAsync({
        type: 'FILE',
        label: label.trim() || undefined,
        fileName: file.name,
        fileSize: file.size,
        fileMimeType: file.type || 'application/octet-stream',
        fileGcsObject: urlRes.data.gcsObject,
      })

      setLabel('')
      setShowLabel(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setUploadError(msg)
    } finally {
      setUploading(null)
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
      {linkDetected && !uploading && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-retro-blue">
          <LinkIcon className="h-3 w-3" />
          <span>Will save as link · {getHostname(content)}</span>
        </div>
      )}
      {uploading && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-retro-blue" />
          <span className="truncate">Uploading {uploading.name}…</span>
        </div>
      )}
      {uploadError && (
        <div className="mb-2 flex items-center justify-between gap-2 text-xs text-destructive">
          <span className="truncate">{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-muted-foreground hover:text-retro-dark"
            aria-label="Dismiss error"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => setShowLabel((s) => !s)}
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors',
            showLabel
              ? 'bg-retro-blue/10 text-retro-blue'
              : 'text-muted-foreground hover:text-retro-blue'
          )}
          aria-label={showLabel ? 'Hide label' : 'Add label'}
          title={showLabel ? 'Hide label' : 'Add label'}
        >
          <Tag className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!!uploading}
          className="flex h-10 w-10 shrink-0 items-center justify-center text-muted-foreground hover:text-retro-blue disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Attach file"
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
        />
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message or paste a URL… (Cmd/Ctrl+Enter to send)"
          rows={1}
          maxLength={50_000}
          disabled={!!uploading}
          className="flex max-h-40 min-h-10 w-full resize-none border-2 border-retro-dark/20 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-retro-blue disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={
            send.isPending ||
            !!uploading ||
            (content.trim().length === 0 && label.trim().length === 0)
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-retro-dark bg-retro-blue text-white shadow-hard transition-transform hover-shadow-grow disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
