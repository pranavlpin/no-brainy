'use client'

import { useState, useCallback } from 'react'
import { GripVertical, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore, DEFAULT_NAV_ORDER } from '@/stores/ui-store'
import { NAV_ITEMS_MAP } from '@/components/layout/sidebar'

export function SidebarOrderSettings(): React.ReactElement {
  const { navOrder, setNavOrder, resetNavOrder } = useUIStore()
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const handleDragStart = useCallback((idx: number) => {
    setDraggedIdx(idx)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setDragOverIdx(idx)
  }, [])

  const handleDrop = useCallback((idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) {
      setDraggedIdx(null)
      setDragOverIdx(null)
      return
    }

    const newOrder = [...navOrder]
    const [moved] = newOrder.splice(draggedIdx, 1)
    newOrder.splice(idx, 0, moved)
    setNavOrder(newOrder)
    setDraggedIdx(null)
    setDragOverIdx(null)
  }, [draggedIdx, navOrder, setNavOrder])

  const handleDragEnd = useCallback(() => {
    setDraggedIdx(null)
    setDragOverIdx(null)
  }, [])

  const moveItem = useCallback((fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= navOrder.length) return
    const newOrder = [...navOrder]
    const [moved] = newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, moved)
    setNavOrder(newOrder)
  }, [navOrder, setNavOrder])

  const isDefault = JSON.stringify(navOrder) === JSON.stringify(DEFAULT_NAV_ORDER)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold text-retro-dark">Sidebar Order</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Drag to reorder navigation items</p>
        </div>
        {!isDefault && (
          <Button variant="ghost" size="sm" onClick={resetNavOrder}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
        )}
      </div>

      <div className="space-y-1">
        {navOrder.map((href, idx) => {
          const item = NAV_ITEMS_MAP[href]
          if (!item) return null
          const Icon = item.icon

          return (
            <div
              key={href}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 border-2 px-3 py-2 cursor-grab active:cursor-grabbing transition-colors select-none ${
                draggedIdx === idx
                  ? 'opacity-40 border-retro-blue/30'
                  : dragOverIdx === idx
                  ? 'border-retro-blue bg-retro-blue/5'
                  : 'border-retro-dark/10 bg-white hover:border-retro-dark/20'
              }`}
            >
              <GripVertical className="h-4 w-4 text-retro-dark/30 shrink-0" />
              <Icon className="h-4 w-4 text-retro-dark/50 shrink-0" />
              <span className="font-mono text-sm text-retro-dark flex-1">{item.label}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => moveItem(idx, idx - 1)}
                  disabled={idx === 0}
                  className="px-1 py-0.5 text-xs text-retro-dark/30 hover:text-retro-dark disabled:opacity-20"
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveItem(idx, idx + 1)}
                  disabled={idx === navOrder.length - 1}
                  className="px-1 py-0.5 text-xs text-retro-dark/30 hover:text-retro-dark disabled:opacity-20"
                  title="Move down"
                >
                  ▼
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
