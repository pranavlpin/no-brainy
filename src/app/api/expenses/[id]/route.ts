import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { updateExpenseSchema } from '@/lib/validations/expenses'
import { ZodError } from 'zod'

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const id = req.nextUrl.pathname.split('/').pop()!

    const expense = await prisma.expense.findFirst({
      where: { id, userId: user.id },
      include: { category: true },
    })

    if (!expense) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: expense.id,
        userId: expense.userId,
        categoryId: expense.categoryId,
        name: expense.name,
        amount: Number(expense.amount),
        date: expense.date.toISOString().split('T')[0],
        tags: expense.tags,
        notes: expense.notes,
        source: expense.source,
        importRef: expense.importRef,
        createdAt: expense.createdAt.toISOString(),
        updatedAt: expense.updatedAt.toISOString(),
        category: expense.category ? {
          id: expense.category.id,
          name: expense.category.name,
          slug: expense.category.slug,
          icon: expense.category.icon,
          color: expense.category.color,
        } : undefined,
      },
    })
  } catch (error) {
    console.error('Expense GET error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})

export const PATCH = withAuth(async (req: NextRequest, user) => {
  try {
    const id = req.nextUrl.pathname.split('/').pop()!
    const body = await req.json()
    const data = updateExpenseSchema.parse(body)

    const expense = await prisma.expense.findFirst({
      where: { id, userId: user.id },
    })

    if (!expense) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } },
        { status: 404 }
      )
    }

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

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        userId: updated.userId,
        categoryId: updated.categoryId,
        name: updated.name,
        amount: Number(updated.amount),
        date: updated.date.toISOString().split('T')[0],
        tags: updated.tags,
        notes: updated.notes,
        source: updated.source,
        importRef: updated.importRef,
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
    console.error('Expense PATCH error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})

export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const id = req.nextUrl.pathname.split('/').pop()!

    const expense = await prisma.expense.findFirst({
      where: { id, userId: user.id },
    })

    if (!expense) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } },
        { status: 404 }
      )
    }

    await prisma.expense.delete({ where: { id } })

    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    console.error('Expense DELETE error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})
