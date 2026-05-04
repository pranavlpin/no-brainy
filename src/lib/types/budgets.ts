export type BudgetType = 'limit' | 'target'
export type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly' | 'total'
export type BudgetHealth = 'on-track' | 'warning' | 'over-budget' | 'completed'

export interface BudgetResponse {
  id: string
  userId: string
  name: string
  type: BudgetType
  categoryId: string
  categoryName: string
  categoryIcon: string
  categoryColor: string
  amount: number
  period: BudgetPeriod
  startDate: string | null
  endDate: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  // Computed fields
  spent: number
  remaining: number
  percentage: number
  health: BudgetHealth
  daysLeft: number | null
}

export interface CreateBudgetRequest {
  name: string
  type?: BudgetType
  categoryId: string
  amount: number
  period?: BudgetPeriod
  startDate?: string
  endDate?: string
}

export interface UpdateBudgetRequest {
  name?: string
  type?: BudgetType
  categoryId?: string
  amount?: number
  period?: BudgetPeriod
  startDate?: string | null
  endDate?: string | null
  isActive?: boolean
}
