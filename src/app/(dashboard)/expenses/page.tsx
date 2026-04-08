'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Upload, List, TableProperties, BarChart3, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExpenseList } from '@/components/expenses/expense-list'
import { ExpenseForm } from '@/components/expenses/expense-form'
import { ExpenseFiltersBar } from '@/components/expenses/expense-filters'
import { ExpenseMatrix } from '@/components/expenses/expense-matrix'
import { ExpenseImportWizard } from '@/components/expenses/expense-import-wizard'
import { ExpenseCharts } from '@/components/expenses/expense-charts'
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/hooks/use-expenses'
import { formatINR, getCurrentMonth, getMonthDateRange } from '@/lib/expenses/formatters'
import type { ExpenseFilters, ExpenseResponse, CreateExpenseRequest, UpdateExpenseRequest } from '@/lib/types/expenses'

type Tab = 'list' | 'summary' | 'charts'

export default function ExpensesPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<Tab>('list')
  const [showForm, setShowForm] = useState(false)
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
      onSuccess: () => setShowForm(false),
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
          <Button onClick={() => { setEditingExpense(undefined); setShowForm(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Add/Edit form */}
      {(showForm || editingExpense) && (
        <div className="rounded-lg border border-border bg-background p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              {editingExpense ? 'Edit Expense' : 'New Expense'}
            </h2>
          </div>
          <ExpenseForm
            expense={editingExpense}
            onSubmit={editingExpense ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditingExpense(undefined) }}
            isPending={createExpense.isPending || updateExpense.isPending}
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
      {activeTab === 'list' && (
        <div className="space-y-4">
          <ExpenseFiltersBar filters={filters} onFiltersChange={setFilters} />
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading expenses...</div>
          ) : (
            <ExpenseList
              expenses={expenses}
              onEdit={(exp) => { setShowForm(false); setEditingExpense(exp) }}
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
