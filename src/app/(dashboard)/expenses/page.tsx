'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Upload, List, TableProperties, BarChart3, Settings2, PenLine, Sheet, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExpenseList } from '@/components/expenses/expense-list'
import { ExpenseForm } from '@/components/expenses/expense-form'
import { ExpenseBulkEntry } from '@/components/expenses/expense-bulk-entry'
import { ExpenseFiltersBar } from '@/components/expenses/expense-filters'
import { ExpenseMatrix } from '@/components/expenses/expense-matrix'
import { ExpenseImportWizard } from '@/components/expenses/expense-import-wizard'
import { ExpenseCharts } from '@/components/expenses/expense-charts'
import { ExpenseAIPanel } from '@/components/expenses/expense-ai-panel'
import { BudgetCard } from '@/components/expenses/budget-card'
import { BudgetForm } from '@/components/expenses/budget-form'
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/hooks/use-expenses'
import { useBudgets, useCreateBudget, useDeleteBudget } from '@/hooks/use-budgets'
import { formatINR, getCurrentMonth, getMonthDateRange } from '@/lib/expenses/formatters'
import type { ExpenseFilters, ExpenseResponse, CreateExpenseRequest, UpdateExpenseRequest } from '@/lib/types/expenses'

type Tab = 'create' | 'list' | 'summary' | 'charts' | 'budgets'
type CreateMode = 'single' | 'bulk'

export default function ExpensesPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<Tab>('create')
  const [createMode, setCreateMode] = useState<CreateMode>('bulk')
  const [showImport, setShowImport] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseResponse | undefined>()
  const editFormRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editingExpense && editFormRef.current) {
      editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [editingExpense])

  const currentMonth = getCurrentMonth()
  const { startDate, endDate } = getMonthDateRange(currentMonth)

  const [filters, setFilters] = useState<ExpenseFilters>({
    startDate,
    endDate,
    sortBy: 'date',
    sortOrder: 'desc',
  })

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useExpenses(filters)
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

  const { data: budgets, isLoading: budgetsLoading } = useBudgets()
  const createBudget = useCreateBudget()
  const deleteBudget = useDeleteBudget()
  const [showBudgetForm, setShowBudgetForm] = useState(false)

  const expenses = data?.pages.flatMap((page) => page.data.items) ?? []
  const totalCount = data?.pages[0]?.data.total ?? 0
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
    { key: 'budgets', label: 'Budgets', icon: <Target className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-retro-dark">Expenses</h1>
          {activeTab === 'list' && totalCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {totalCount} expense{totalCount !== 1 ? 's' : ''} &middot; {formatINR(total)}
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
        <div ref={editFormRef} className="rounded-lg border border-border bg-background p-6">
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
      <div className="flex gap-1 border-b-2 border-retro-dark/10">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 font-mono text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-retro-blue text-retro-dark'
                : 'text-retro-dark/40 hover:text-retro-dark/70'
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
            <button
              onClick={() => setCreateMode('bulk')}
              className={`flex items-center gap-2 border-2 px-3 py-1.5 font-mono text-xs font-bold transition-colors ${
                createMode === 'bulk'
                  ? 'border-retro-dark bg-retro-dark text-white'
                  : 'border-retro-dark/30 bg-white text-retro-dark hover:border-retro-dark/60'
              }`}
            >
              <Sheet className="h-3.5 w-3.5" />
              Bulk Entry
            </button>
            <button
              onClick={() => setCreateMode('single')}
              className={`flex items-center gap-2 border-2 px-3 py-1.5 font-mono text-xs font-bold transition-colors ${
                createMode === 'single'
                  ? 'border-retro-dark bg-retro-dark text-white'
                  : 'border-retro-dark/30 bg-white text-retro-dark hover:border-retro-dark/60'
              }`}
            >
              <PenLine className="h-3.5 w-3.5" />
              Single Entry
            </button>
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
            <>
              <ExpenseList
                expenses={expenses}
                onEdit={(exp) => setEditingExpense(exp)}
                onDelete={handleDelete}
                isDeleting={deleteExpense.isPending}
              />
              {hasNextPage && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="font-mono text-sm text-retro-blue hover:underline disabled:opacity-50"
                  >
                    {isFetchingNextPage ? 'Loading more...' : `Load more (showing ${expenses.length} of ${totalCount})`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'summary' && <ExpenseMatrix />}

      {activeTab === 'charts' && (
        <div className="space-y-6">
          <ExpenseAIPanel />
          <ExpenseCharts />
        </div>
      )}

      {activeTab === 'budgets' && (
        <div className="space-y-4">
          {showBudgetForm ? (
            <BudgetForm
              onSubmit={(data) => {
                createBudget.mutate(data, {
                  onSuccess: () => setShowBudgetForm(false),
                })
              }}
              onCancel={() => setShowBudgetForm(false)}
              isPending={createBudget.isPending}
            />
          ) : (
            <button
              onClick={() => setShowBudgetForm(true)}
              className="flex items-center gap-2 border-2 border-dashed border-retro-dark/30 px-4 py-2 font-mono text-sm font-bold text-retro-dark/60 hover:border-retro-dark/60 hover:text-retro-dark transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Budget
            </button>
          )}

          {budgetsLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading budgets...</div>
          ) : budgets && budgets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgets.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  onEdit={() => {/* TODO: edit modal */}}
                  onDelete={(id) => deleteBudget.mutate(id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="font-mono text-sm text-retro-dark/40">No budgets yet. Add one to track your spending limits or savings targets.</p>
            </div>
          )}
        </div>
      )}

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
