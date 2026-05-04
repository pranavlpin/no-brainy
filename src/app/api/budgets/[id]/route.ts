import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { updateBudgetSchema } from '@/lib/validations/budgets'
import { ZodError } from 'zod'

export const PATCH = withAuth(async (req: NextRequest, user) => {
  try {
    const id = req.nextUrl.pathname.split('/').pop()!
    const body = await req.json()
    const data = updateBudgetSchema.parse(body)

    const budget = await prisma.budget.findFirst({
      where: { id, userId: user.id },
    })

    if (!budget) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Budget not found' } },
        { status: 404 }
      )
    }

    // If updating category, validate it belongs to user
    if (data.categoryId) {
      const category = await prisma.expenseCategory.findFirst({
        where: { id: data.categoryId, userId: user.id },
      })
      if (!category) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } },
          { status: 404 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.type !== undefined) updateData.type = data.type
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.period !== undefined) updateData.period = data.period
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null

    const updated = await prisma.budget.update({
      where: { id },
      data: updateData,
      include: { category: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        userId: updated.userId,
        name: updated.name,
        type: updated.type,
        categoryId: updated.categoryId,
        categoryName: updated.category.name,
        categoryIcon: updated.category.icon,
        categoryColor: updated.category.color,
        amount: Number(updated.amount),
        period: updated.period,
        startDate: updated.startDate ? updated.startDate.toISOString().split('T')[0] : null,
        endDate: updated.endDate ? updated.endDate.toISOString().split('T')[0] : null,
        isActive: updated.isActive,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    })
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
    console.error('Budget PATCH error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})

export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const id = req.nextUrl.pathname.split('/').pop()!

    const budget = await prisma.budget.findFirst({
      where: { id, userId: user.id },
    })

    if (!budget) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Budget not found' } },
        { status: 404 }
      )
    }

    await prisma.budget.delete({ where: { id } })

    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    console.error('Budget DELETE error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})
