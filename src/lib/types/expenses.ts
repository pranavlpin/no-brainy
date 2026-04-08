export interface ExpenseCategoryResponse {
  id: string
  userId: string
  name: string
  slug: string
  icon: string
  color: string
  isDefault: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  expenseCount?: number
}

export interface ExpenseResponse {
  id: string
  userId: string
  categoryId: string
  name: string
  amount: number
  date: string
  tags: string[]
  notes: string | null
  source: string
  importRef: string | null
  createdAt: string
  updatedAt: string
  category?: ExpenseCategoryResponse
}

export interface CreateExpenseRequest {
  categoryId: string
  name: string
  amount: number
  date: string
  tags?: string[]
  notes?: string
  source?: string
  importRef?: string
}

export interface UpdateExpenseRequest {
  categoryId?: string
  name?: string
  amount?: number
  date?: string
  tags?: string[]
  notes?: string | null
}

export interface CreateCategoryRequest {
  name: string
  slug?: string
  icon?: string
  color?: string
}

export interface UpdateCategoryRequest {
  name?: string
  icon?: string
  color?: string
  sortOrder?: number
}

export interface ExpenseFilters {
  startDate?: string
  endDate?: string
  categoryId?: string
  tags?: string[]
  search?: string
  source?: string
  sortBy?: 'date' | 'amount' | 'name' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface ExpenseSummaryRow {
  category: string
  categoryId: string
  color: string
  icon: string
  months: Record<string, number>
  total: number
}

export interface ExpenseSummaryResponse {
  rows: ExpenseSummaryRow[]
  months: string[]
  monthTotals: Record<string, number>
  grandTotal: number
}

export interface BulkExpenseRequest {
  expenses: CreateExpenseRequest[]
}
