'use client'

import * as React from 'react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, X } from 'lucide-react'

export interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
  id?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className,
  required,
  id,
}: SearchableSelectProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const sorted = React.useMemo(
    () => [...options].sort((a, b) => a.label.localeCompare(b.label)),
    [options]
  )

  const filtered = React.useMemo(
    () =>
      sorted.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      ),
    [sorted, search]
  )

  const selectedLabel = options.find((o) => o.value === value)?.label ?? ''

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false)
      setSearch('')
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  function handleSelect(optValue: string): void {
    onChange(optValue)
    setIsOpen(false)
    setSearch('')
  }

  function handleClear(e: React.MouseEvent): void {
    e.stopPropagation()
    onChange('')
    setSearch('')
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Hidden input for form validation */}
      {required && (
        <input
          tabIndex={-1}
          className="absolute opacity-0 h-0 w-0"
          value={value}
          onChange={() => {}}
          required
        />
      )}

      <button
        type="button"
        id={id}
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0)
          }
        }}
        className={cn(
          'flex h-10 w-full items-center justify-between border-2 border-retro-dark/20 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-retro-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      >
        <span className={cn(!value && 'text-muted-foreground')}>
          {selectedLabel || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <X
              className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
              onClick={handleClear}
            />
          )}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border-2 border-retro-dark/20 bg-background shadow-md">
          <div className="p-2">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded border border-retro-dark/10 bg-background px-2 py-1.5 text-sm outline-none focus:border-retro-blue"
            />
          </div>
          <div className="max-h-48 overflow-y-auto px-1 pb-1">
            {filtered.length === 0 ? (
              <div className="px-2 py-2 text-xs text-muted-foreground">
                No results found
              </div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    'flex w-full items-center rounded px-2 py-1.5 text-sm hover:bg-primary/10',
                    opt.value === value && 'bg-primary/10 font-medium'
                  )}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
