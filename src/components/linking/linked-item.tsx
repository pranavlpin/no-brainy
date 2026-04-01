'use client'

import { X, FileText, CheckSquare, BookOpen, Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export interface LinkedItemData {
  targetType: string
  targetId: string
  title: string
  extra?: Record<string, unknown>
}

interface LinkedItemProps {
  item: LinkedItemData
  onRemove: (targetType: string, targetId: string) => void
}

const typeConfig: Record<string, { icon: typeof FileText; color: string; route: string; label: string }> = {
  note: { icon: FileText, color: 'text-blue-500', route: '/notes', label: 'Note' },
  task: { icon: CheckSquare, color: 'text-green-500', route: '/tasks', label: 'Task' },
  book: { icon: BookOpen, color: 'text-orange-500', route: '/books', label: 'Book' },
  deck: { icon: Layers, color: 'text-purple-500', route: '/decks', label: 'Deck' },
}

export function LinkedItem({ item, onRemove }: LinkedItemProps) {
  const config = typeConfig[item.targetType] ?? {
    icon: FileText,
    color: 'text-muted-foreground',
    route: '/',
    label: item.targetType,
  }
  const Icon = config.icon

  return (
    <div className="group flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent/50">
      <Icon className={`h-4 w-4 shrink-0 ${config.color}`} />
      <Link
        href={`${config.route}/${item.targetId}`}
        className="flex-1 truncate hover:underline"
      >
        {item.title}
      </Link>
      {item.extra?.status ? (
        <Badge variant="outline" className="text-xs">
          {String(item.extra.status)}
        </Badge>
      ) : null}
      {item.extra?.author ? (
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {String(item.extra.author)}
        </span>
      ) : null}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
        onClick={(e) => {
          e.preventDefault()
          onRemove(item.targetType, item.targetId)
        }}
        title="Remove link"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
