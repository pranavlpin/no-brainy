import { z } from 'zod'

export const createExpenseSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required').max(500),
  amount: z.number().finite(),
  date: z.string().min(1, 'Date is required'),
  tags: z.array(z.string()).default([]),
  notes: z.string().nullable().optional(),
  source: z.enum(['manual', 'csv_import', 'txt_import']).default('manual'),
  importRef: z.string().nullable().optional(),
})

export const updateExpenseSchema = z.object({
  categoryId: z.string().min(1).optional(),
  name: z.string().min(1).max(500).optional(),
  amount: z.number().finite().optional(),
  date: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
})

export const expenseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.string().optional(),
  search: z.string().optional(),
  source: z.string().optional(),
  sortBy: z.enum(['date', 'amount', 'name', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().max(100).optional(),
  icon: z.string().max(50).default('tag'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').default('#6B7280'),
})

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  sortOrder: z.number().int().optional(),
})

export const bulkExpenseSchema = z.object({
  expenses: z.array(createExpenseSchema).min(1).max(500),
})

export const summaryQuerySchema = z.object({
  startMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM').optional(),
  endMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM').optional(),
})
