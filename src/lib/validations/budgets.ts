import { z } from 'zod'

export const createBudgetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  type: z.enum(['limit', 'target']).default('limit'),
  categoryId: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  period: z.enum(['monthly', 'quarterly', 'yearly', 'total']).default('monthly'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const updateBudgetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(['limit', 'target']).optional(),
  categoryId: z.string().min(1).optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  period: z.enum(['monthly', 'quarterly', 'yearly', 'total']).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

export const budgetQuerySchema = z.object({
  isActive: z.coerce.boolean().optional(),
  categoryId: z.string().optional(),
  type: z.enum(['limit', 'target']).optional(),
})
