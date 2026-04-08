import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { createExpenseSchema, expenseQuerySchema } from '@/lib/validations/expenses'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const queryObj: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryObj[key] = value
    })

    const query = expenseQuerySchema.parse(queryObj)
    const { page, pageSize, sortBy, sortOrder } = query

    const where: Prisma.ExpenseWhereInput = { userId: user.id }

    if (query.startDate) where.date = { ...(where.date as object), gte: new Date(query.startDate) }
    if (query.endDate) where.date = { ...(where.date as object), lte: new Date(query.endDate) }
    if (query.categoryId) where.categoryId = query.categoryId
    if (query.source) where.source = query.source
    if (query.tags) where.tags = { hasSome: query.tags.split(',') }
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { category: true },
      }),
      prisma.expense.count({ where }),
    ])

    const items = expenses.map((exp) => ({
      id: exp.id,
      userId: exp.userId,
      categoryId: exp.categoryId,
      name: exp.name,
      amount: Number(exp.amount),
      date: exp.date.toISOString().split('T')[0],
      tags: exp.tags,
      notes: exp.notes,
      source: exp.source,
      importRef: exp.importRef,
      createdAt: exp.createdAt.toISOString(),
      updatedAt: exp.updatedAt.toISOString(),
      category: exp.category ? {
        id: exp.category.id,
        userId: exp.category.userId,
        name: exp.category.name,
        slug: exp.category.slug,
        icon: exp.category.icon,
        color: exp.category.color,
        isDefault: exp.category.isDefault,
        sortOrder: exp.category.sortOrder,
        createdAt: exp.category.createdAt.toISOString(),
        updatedAt: exp.category.updatedAt.toISOString(),
      } : undefined,
    }))

    return NextResponse.json({
      success: true,
      data: { items, total, page, pageSize, hasMore: page * pageSize < total },
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
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details } },
        { status: 400 }
      )
    }
    console.error('Expenses GET error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const data = createExpenseSchema.parse(body)

    const category = await prisma.expenseCategory.findFirst({
      where: { id: data.categoryId, userId: user.id },
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 }
      )
    }

    const expense = await prisma.expense.create({
      data: {
        userId: user.id,
        categoryId: data.categoryId,
        name: data.name,
        amount: data.amount,
        date: new Date(data.date),
        tags: data.tags,
        notes: data.notes ?? null,
        source: data.source,
        importRef: data.importRef ?? null,
      },
      include: { category: true },
    })

    return NextResponse.json(
      {
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
        },
      },
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
    console.error('Expenses POST error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})
