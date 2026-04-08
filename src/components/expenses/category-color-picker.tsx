'use client'

import { cn } from '@/lib/utils'

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981',
  '#059669', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#E11D48',
  '#DC2626', '#D97706', '#16A34A', '#0D9488', '#0284C7',
  '#4F46E5', '#7C3AED', '#9333EA', '#C026D3', '#DB2777',
  '#64748B', '#475569', '#334155', '#FB923C', '#22D3EE',
]

interface CategoryColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function CategoryColorPicker({ value, onChange }: CategoryColorPickerProps): React.ReactElement {
  return (
    <div className="grid grid-cols-10 gap-1.5">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
            value === color ? 'border-foreground scale-110' : 'border-transparent'
          )}
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  )
}
