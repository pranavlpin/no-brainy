'use client'

import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useExpenseCategories } from '@/hooks/use-expense-categories'
import type { ExpenseFilters } from '@/lib/types/expenses'

interface ExpenseFiltersBarProps {
  filters: ExpenseFilters
  onFiltersChange: (filters: ExpenseFilters) => void
}

export function ExpenseFiltersBar({ filters, onFiltersChange }: ExpenseFiltersBarProps): React.ReactElement {
  const { data: categories } = useExpenseCategories()

  const update = (partial: Partial<ExpenseFilters>): void => {
    onFiltersChange({ ...filters, ...partial })
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <Input
        placeholder="Search expenses..."
        value={filters.search ?? ''}
        onChange={(e) => update({ search: e.target.value || undefined })}
        className="w-full sm:w-56"
      />
      <Input
        type="date"
        value={filters.startDate ?? ''}
        onChange={(e) => update({ startDate: e.target.value || undefined })}
        className="w-full sm:w-40"
      />
      <span className="hidden sm:inline text-muted-foreground">to</span>
      <Input
        type="date"
        value={filters.endDate ?? ''}
        onChange={(e) => update({ endDate: e.target.value || undefined })}
        className="w-full sm:w-40"
      />
      <Select
        value={filters.categoryId ?? ''}
        onChange={(e) => update({ categoryId: e.target.value || undefined })}
        className="w-full sm:w-44"
      >
        <option value="">All categories</option>
        {categories?.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </Select>
      <Input
        placeholder="Filter by tags..."
        value={filters.tags?.join(', ') ?? ''}
        onChange={(e) => {
          const val = e.target.value
          const tags = val ? val.split(',').map((t) => t.trim()).filter(Boolean) : undefined
          update({ tags })
        }}
        className="w-full sm:w-44"
      />
      <Select
        value={`${filters.sortBy ?? 'date'}_${filters.sortOrder ?? 'desc'}`}
        onChange={(e) => {
          const [sortBy, sortOrder] = e.target.value.split('_') as [ExpenseFilters['sortBy'], ExpenseFilters['sortOrder']]
          update({ sortBy, sortOrder })
        }}
        className="w-full sm:w-44"
      >
        <option value="date_desc">Date (newest)</option>
        <option value="date_asc">Date (oldest)</option>
        <option value="amount_desc">Amount (highest)</option>
        <option value="amount_asc">Amount (lowest)</option>
        <option value="name_asc">Name (A-Z)</option>
        <option value="name_desc">Name (Z-A)</option>
      </Select>
    </div>
  )
}
