'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Upload, List, TableProperties, BarChart3, Settings2, PenLine, Sheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExpenseList } from '@/components/expenses/expense-list'
import { ExpenseForm } from '@/components/expenses/expense-form'
import { ExpenseBulkEntry } from '@/components/expenses/expense-bulk-entry'
import { ExpenseFiltersBar } from '@/components/expenses/expense-filters'
import { ExpenseMatrix } from '@/components/expenses/expense-matrix'
import { ExpenseImportWizard } from '@/components/expenses/expense-import-wizard'
import { ExpenseCharts } from '@/components/expenses/expense-charts'
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/hooks/use-expenses'
import { formatINR, getCurrentMonth, getMonthDateRange } from '@/lib/expenses/formatters'
import type { ExpenseFilters, ExpenseResponse, CreateExpenseRequest, UpdateExpenseRequest } from '@/lib/types/expenses'

type Tab = 'create' | 'list' | 'summary' | 'charts'
type CreateMode = 'single' | 'bulk'

export default function ExpensesPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<Tab>('create')
  const [createMode, setCreateMode] = useState<CreateMode>('bulk')
  const [showImport, setShowImport] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseResponse | undefined>()

  const currentMonth = getCurrentMonth()
  const { startDate, endDate } = getMonthDateRange(currentMonth)

  const [filters, setFilters] = useState<ExpenseFilters>({
    startDate,
    endDate,
    sortBy: 'date',
    sortOrder: 'desc',
  })

  const { data, isLoading } = useExpenses(filters)
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

  const expenses = data?.items ?? []
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  const handleCreate = (formData: CreateExpenseRequest | UpdateExpenseRequest): void => {
    createExpense.mutate(formData as CreateExpenseRequest, {
      onSuccess: () => {
        // Stay on create tab, form resets itself
      },
    })
  }

  const handleUpdate = (formData: CreateExpenseRequest | UpdateExpenseRequest): void => {
    if (!editingExpense) return
    updateExpense.mutate(
      { id: editingExpense.id, data: formData as UpdateExpenseRequest },
      { onSuccess: () => setEditingExpense(undefined) },
    )
  }

  const handleDelete = (id: string): void => {
    deleteExpense.mutate(id)
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'create', label: 'Create', icon: <Plus className="h-4 w-4" /> },
    { key: 'list', label: 'Expenses', icon: <List className="h-4 w-4" /> },
    { key: 'summary', label: 'Summary', icon: <TableProperties className="h-4 w-4" /> },
    { key: 'charts', label: 'Charts', icon: <BarChart3 className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          {activeTab === 'list' && expenses.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {expenses.length} expense{expenses.length !== 1 ? 's' : ''} &middot; {formatINR(total)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/expenses/categories">
            <Button variant="ghost" size="sm">
              <Settings2 className="mr-2 h-4 w-4" />
              Categories
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      {/* Edit form (shown on list tab when editing) */}
      {editingExpense && (
        <div className="rounded-lg border border-border bg-background p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Edit Expense</h2>
          </div>
          <ExpenseForm
            expense={editingExpense}
            onSubmit={handleUpdate}
            onCancel={() => setEditingExpense(undefined)}
            isPending={updateExpense.isPending}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'create' && (
        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={createMode === 'bulk' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCreateMode('bulk')}
            >
              <Sheet className="mr-2 h-4 w-4" />
              Bulk Entry
            </Button>
            <Button
              variant={createMode === 'single' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCreateMode('single')}
            >
              <PenLine className="mr-2 h-4 w-4" />
              Single Entry
            </Button>
          </div>

          {createMode === 'single' ? (
            <div className="max-w-lg">
              <ExpenseForm
                onSubmit={handleCreate}
                onCancel={() => setActiveTab('list')}
                isPending={createExpense.isPending}
              />
              {createExpense.isSuccess && (
                <p className="mt-3 text-sm text-green-600 font-medium">Expense added successfully!</p>
              )}
            </div>
          ) : (
            <ExpenseBulkEntry />
          )}
        </div>
      )}

      {activeTab === 'list' && (
        <div className="space-y-4">
          <ExpenseFiltersBar filters={filters} onFiltersChange={setFilters} />
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading expenses...</div>
          ) : (
            <ExpenseList
              expenses={expenses}
              onEdit={(exp) => setEditingExpense(exp)}
              onDelete={handleDelete}
              isDeleting={deleteExpense.isPending}
            />
          )}
        </div>
      )}

      {activeTab === 'summary' && <ExpenseMatrix />}

      {activeTab === 'charts' && <ExpenseCharts />}

      {/* Import wizard */}
      {showImport && (
        <ExpenseImportWizard
          onClose={() => setShowImport(false)}
          onComplete={() => {
            setShowImport(false)
          }}
        />
      )}
    </div>
  )
}
