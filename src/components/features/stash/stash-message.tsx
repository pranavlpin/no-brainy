'use client'

import { Pin, Trash2, Link as LinkIcon, ExternalLink, FileText, Download, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getHostname } from '@/lib/stash/url'
import type { StashMessageResponse } from '@/types/stash'

interface StashMessageProps {
  message: StashMessageResponse
  onTogglePin?: (id: string, isPinned: boolean) => void
  onDelete?: (id: string) => void
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function LinkCard({ url, title }: { url: string; title: string | null }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-md border border-retro-blue/20 bg-background p-2.5 hover:border-retro-blue/40 hover:bg-retro-blue/5"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-retro-blue/10 text-retro-blue">
        <LinkIcon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="truncate">{getHostname(url)}</span>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <div className="mt-0.5 truncate text-sm font-medium text-retro-dark">
          {title || url}
        </div>
      </div>
    </a>
  )
}

function FileCard({
  messageId,
  fileName,
  fileSize,
  mimeType,
}: {
  messageId: string
  fileName: string
  fileSize: number | null
  mimeType: string | null
}) {
  const isImage = mimeType?.startsWith('image/') ?? false
  const fileUrl = `/api/stash/files/${messageId}`

  if (isImage) {
    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block max-w-[320px] overflow-hidden rounded-md border border-retro-blue/20 bg-background hover:border-retro-blue/40"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fileUrl}
          alt={fileName}
          className="max-h-80 w-full object-cover"
          loading="lazy"
        />
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ImageIcon className="h-3 w-3 shrink-0" />
            <span className="truncate">{fileName}</span>
          </div>
          <span className="text-muted-foreground">{formatBytes(fileSize)}</span>
        </div>
      </a>
    )
  }

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-md border border-retro-blue/20 bg-background p-2.5 hover:border-retro-blue/40 hover:bg-retro-blue/5"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-retro-blue/10 text-retro-blue">
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-retro-dark">{fileName}</div>
        <div className="text-xs text-muted-foreground">{formatBytes(fileSize)}</div>
      </div>
      <Download className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  )
}

export function StashMessage({ message, onTogglePin, onDelete }: StashMessageProps) {
  return (
    <div className="group flex flex-col items-end">
      <div className="relative max-w-[80%] rounded-lg border border-retro-blue/20 bg-retro-blue/5 px-3.5 py-2.5">
        {message.label && (
          <div className="mb-1 text-xs font-semibold text-retro-blue">{message.label}</div>
        )}
        {message.type === 'TEXT' && (
          <p className="whitespace-pre-wrap break-words text-sm text-retro-dark">
            {message.content}
          </p>
        )}
        {message.type === 'LINK' && message.linkUrl && (
          <LinkCard url={message.linkUrl} title={message.linkTitle} />
        )}
        {message.type === 'FILE' && message.fileName && (
          <FileCard
            messageId={message.id}
            fileName={message.fileName}
            fileSize={message.fileSize}
            mimeType={message.fileMimeType}
          />
        )}
        <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
          {message.isPinned && <Pin className="h-2.5 w-2.5 text-retro-blue" />}
          <span>{formatTime(message.createdAt)}</span>
        </div>

        <div className="absolute -left-16 top-1/2 hidden -translate-y-1/2 items-center gap-1 group-hover:flex">
          <button
            type="button"
            onClick={() => onTogglePin?.(message.id, !message.isPinned)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md hover:bg-retro-blue/10',
              message.isPinned ? 'text-retro-blue' : 'text-muted-foreground'
            )}
            aria-label={message.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(message.id)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
