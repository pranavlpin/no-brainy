import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { parseWatchlistFile } from '@/lib/watchlist/imdb-parser'

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

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'File too large. Maximum 5MB.' } },
        { status: 400 }
      )
    }

    const content = await file.text()
    const result = parseWatchlistFile(content, file.name)

    if (result.items.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'PARSE_ERROR', message: result.errors[0] || 'No items found in file' } },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        items: result.items,
        format: result.format,
        totalItems: result.items.length,
        errors: result.errors,
      },
    })
  } catch (error) {
    console.error('Watchlist import parse error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to parse file' } },
      { status: 500 }
    )
  }
})
