import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { parseFile } from '@/lib/expenses/parser'
import { categorizeRows } from '@/lib/expenses/category-matcher'

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No file provided' } },
        { status: 400 }
      )
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'File too large. Maximum size is 5MB.' } },
        { status: 400 }
      )
    }

    const content = await file.text()
    const result = parseFile(content, file.name)

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PARSE_ERROR',
            message: result.errors.length > 0 ? result.errors[0] : 'No transactions found in file',
          },
        },
        { status: 400 }
      )
    }

    const categorizedRows = categorizeRows(result.rows)

    return NextResponse.json({
      success: true,
      data: {
        rows: categorizedRows,
        format: result.format,
        totalRows: categorizedRows.length,
        totalAmount: categorizedRows.reduce((sum, r) => sum + r.amount, 0),
        errors: result.errors,
      },
    })
  } catch (error) {
    console.error('Import parse error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to parse file' } },
      { status: 500 }
    )
  }
})
