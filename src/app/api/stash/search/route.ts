import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { searchSchema } from '@/lib/validations/stash'
import { decryptContent } from '@/lib/stash/encrypt-message'
import type { Prisma } from '@prisma/client'
import type { StashSearchResult } from '@/types/stash'
import type { ApiResponse } from '@/lib/types/api'

const MAX_RESULTS = 100

interface RowWithChannel {
  id: string
  channelId: string
  userId: string
  type: 'TEXT' | 'LINK' | 'FILE'
  label: string | null
  content: string
  isEncrypted: boolean
  linkUrl: string | null
  linkTitle: string | null
  linkDescription: string | null
  linkImageUrl: string | null
  fileName: string | null
  fileSize: number | null
  fileMimeType: string | null
  fileGcsObject: string | null
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
  channel: {
    id: string
    name: string
    isSensitive: boolean
    icon: string | null
    color: string | null
  }
}

function scoreRow(row: RowWithChannel, decryptedContent: string, q: string): number {
  const ql = q.toLowerCase()
  let score = 0
  if (row.label?.toLowerCase().includes(ql)) score += 10
  if (row.channel.name.toLowerCase().includes(ql)) score += 5
  if (row.linkUrl?.toLowerCase().includes(ql)) score += 3
  if (row.linkTitle?.toLowerCase().includes(ql)) score += 3
  if (row.fileName?.toLowerCase().includes(ql)) score += 3
  if (!row.isEncrypted && decryptedContent.toLowerCase().includes(ql)) score += 1
  return score
}

function formatResult(row: RowWithChannel, decryptedContent: string, score: number): StashSearchResult {
  return {
    id: row.id,
    channelId: row.channelId,
    userId: row.userId,
    type: row.type,
    label: row.label,
    content: decryptedContent,
    isEncrypted: row.isEncrypted,
    linkUrl: row.linkUrl,
    linkTitle: row.linkTitle,
    linkDescription: row.linkDescription,
    linkImageUrl: row.linkImageUrl,
    fileName: row.fileName,
    fileSize: row.fileSize,
    fileMimeType: row.fileMimeType,
    fileGcsObject: row.fileGcsObject,
    isPinned: row.isPinned,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    channel: row.channel,
    score,
  }
}

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const queryObj: Record<string, string> = {}
    searchParams.forEach((v, k) => { queryObj[k] = v })
    const { q, channelId, type } = searchSchema.parse(queryObj)

    const trimmed = q.trim()
    if (trimmed.length === 0) {
      const response: ApiResponse<StashSearchResult[]> = { success: true, data: [] }
      return NextResponse.json(response)
    }

    const where: Prisma.StashMessageWhereInput = {
      userId: user.id,
      isDeleted: false,
      channel: { isDeleted: false },
      ...(channelId ? { channelId } : {}),
      ...(type ? { type } : {}),
      OR: [
        { label: { contains: trimmed, mode: 'insensitive' } },
        { linkUrl: { contains: trimmed, mode: 'insensitive' } },
        { linkTitle: { contains: trimmed, mode: 'insensitive' } },
        { fileName: { contains: trimmed, mode: 'insensitive' } },
        { channel: { name: { contains: trimmed, mode: 'insensitive' } } },
        { AND: [{ isEncrypted: false }, { content: { contains: trimmed, mode: 'insensitive' } }] },
      ],
    }

    const rows = await prisma.stashMessage.findMany({
      where,
      include: {
        channel: { select: { id: true, name: true, isSensitive: true, icon: true, color: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_RESULTS,
    })

    const scored = rows.map((row) => {
      const decryptedContent = decryptContent(row.content, row.isEncrypted)
      const score = scoreRow(row, decryptedContent, trimmed)
      return { row, decryptedContent, score }
    })

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.row.createdAt.getTime() - a.row.createdAt.getTime()
    })

    const items = scored.map(({ row, decryptedContent, score }) => formatResult(row, decryptedContent, score))

    const response: ApiResponse<StashSearchResult[]> = { success: true, data: items }
    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ZodError) {
      const details: Record<string, string[]> = {}
      for (const issue of error.issues) {
        const field = issue.path.join('.')
        if (!details[field]) details[field] = []
        details[field].push(issue.message)
      }
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query', details } },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Search failed' } },
      { status: 500 }
    )
  }
})
