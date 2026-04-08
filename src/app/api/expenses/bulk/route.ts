import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { bulkExpenseSchema } from '@/lib/validations/expenses'
import { ZodError } from 'zod'

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const { expenses } = bulkExpenseSchema.parse(body)

    const categoryIds = Array.from(new Set(expenses.map((e) => e.categoryId)))
    const categories = await prisma.expenseCategory.findMany({
      where: { id: { in: categoryIds }, userId: user.id },
      select: { id: true },
    })
    const validCategoryIds = new Set(categories.map((c) => c.id))

    const invalidCategories = categoryIds.filter((id) => !validCategoryIds.has(id))
    if (invalidCategories.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: `Invalid category IDs: ${invalidCategories.join(', ')}` } },
        { status: 404 }
      )
    }

    const result = await prisma.expense.createMany({
      data: expenses.map((exp) => ({
        userId: user.id,
        categoryId: exp.categoryId,
        name: exp.name,
        amount: exp.amount,
        date: new Date(exp.date),
        tags: exp.tags ?? [],
        notes: exp.notes ?? null,
        source: exp.source ?? 'manual',
        importRef: exp.importRef ?? null,
      })),
    })

    return NextResponse.json(
      { success: true, data: { created: result.count } },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      const details: Record<string, string[]> = {}
      for (const issue of error.issues) {
        const field = issue.path.join('.')
        if (!details[field]) details[field] = []
        details[field].push(issue.message)
      }
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details } },
        { status: 400 }
      )
    }
    console.error('Bulk expenses POST error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})

export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('categoryId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = { userId: user.id }
    if (categoryId) where.categoryId = categoryId
    if (startDate) where.date = { ...(where.date as object || {}), gte: new Date(startDate) }
    if (endDate) where.date = { ...(where.date as object || {}), lte: new Date(endDate) }

    const result = await prisma.expense.deleteMany({ where })

    return NextResponse.json({ success: true, data: { deleted: result.count } })
  } catch (error) {
    console.error('Bulk expenses DELETE error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})
