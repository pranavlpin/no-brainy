'use client'

import { useState } from 'react'
import { Link2, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LinkedItem, type LinkedItemData } from './linked-item'
import { LinkPickerModal } from './link-picker-modal'

export interface LinkManagerProps {
  entityType: 'note' | 'task'
  entityId: string
  links: LinkedItemData[]
  onAdd: (targetType: string, targetId: string) => void
  onRemove: (targetType: string, targetId: string) => void
}

const typeGroupOrder = ['note', 'task', 'book', 'deck']
const typeGroupLabels: Record<string, string> = {
  note: 'Notes',
  task: 'Tasks',
  book: 'Books',
  deck: 'Decks',
}

const allowedTypesForEntity: Record<string, string[]> = {
  note: ['note', 'task', 'book', 'deck'],
  task: ['note', 'book'],
}

export function LinkManager({ entityType, entityId, links, onAdd, onRemove }: LinkManagerProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [showPicker, setShowPicker] = useState(false)

  // Group links by type
  const grouped = typeGroupOrder
    .map((type) => ({
      type,
      label: typeGroupLabels[type] || type,
      items: links.filter((l) => l.targetType === type),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <Link2 className="h-4 w-4" />
          Links
          {links.length > 0 && (
            <span className="ml-1 text-xs">({links.length})</span>
          )}
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPicker(true)}
          className="h-7 gap-1 text-xs"
        >
          <Plus className="h-3 w-3" />
          Add Link
        </Button>
      </div>

      {/* Links list */}
      {isOpen && (
        <div className="space-y-3">
          {grouped.length === 0 && (
            <p className="py-2 text-center text-xs text-muted-foreground">
              No linked items yet
            </p>
          )}
          {grouped.map((group) => (
            <div key={group.type} className="space-y-1">
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h4>
              {group.items.map((item) => (
                <LinkedItem
                  key={`${item.targetType}-${item.targetId}`}
                  item={item}
                  onRemove={onRemove}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Picker modal */}
      <LinkPickerModal
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={onAdd}
        allowedTypes={allowedTypesForEntity[entityType] || ['note']}
        excludeId={entityId}
      />
    </div>
  )
}
