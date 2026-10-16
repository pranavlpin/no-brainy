import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import type { GrowthEvidence, Prisma } from '@prisma/client'
import { dateKeyFromDate } from '@/lib/dates'
import type { EvidenceResponse, GrowthSourceItem, GrowthSourceType } from '@/lib/types/growth'

export class GrowthError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
  }
}

export function growthFailure(error: unknown) {
  const status = error instanceof GrowthError ? error.status : error instanceof ZodError ? 400 : 500
  if (status === 500) console.error('[growth]', error)
  return NextResponse.json(
    {
      success: false,
      error: {
        code:
          status === 409
            ? 'CONFLICT'
            : status === 404
              ? 'NOT_FOUND'
              : status === 400
                ? 'VALIDATION_ERROR'
                : 'INTERNAL_ERROR',
        message:
          error instanceof GrowthError
            ? error.message
            : error instanceof ZodError
              ? (error.issues[0]?.message ?? 'Check your input')
              : 'Could not save this change. Your input is kept; retry.',
      },
    },
    { status }
  )
}

export function sourceHref(type: string | null, id: string | null): string | null {
  if (!type || !id) return null
  if (type === 'note') return `/notes/${id}`
  if (type === 'book') return `/books/${id}`
  if (type === 'project') return `/projects/${id}`
  if (type === 'session') return '/reviews/daily'
  return null
}

export function serializeEvidence(item: GrowthEvidence): EvidenceResponse {
  return {
    id: item.id,
    goalId: item.goalId,
    observedAt: item.observedAt.toISOString().slice(0, 10),
    summary: item.summary,
    measurement: item.measurement ?? null,
    kind: item.kind as EvidenceResponse['kind'],
    sourceType: (item.sourceType as GrowthSourceType | null) ?? null,
    sourceId: item.sourceId ?? null,
    sourceTitle: item.sourceTitle ?? null,
    sourceHref: sourceHref(item.sourceType, item.sourceId),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

export interface ResolvedSource extends GrowthSourceItem {
  type: GrowthSourceType
}

/** Resolve an explicitly chosen, owned source; nothing is fetched from outside. */
export async function ownedGrowthSource(
  db: Prisma.TransactionClient,
  userId: string,
  type: GrowthSourceType,
  id: string,
  tz: string
): Promise<ResolvedSource> {
  if (type === 'note') {
    const item = await db.note.findFirst({ where: { id, userId, isDeleted: false }, select: { title: true } })
    if (item) return { type, id, title: item.title || 'Untitled note' }
  } else if (type === 'book') {
    const item = await db.book.findFirst({ where: { id, userId }, select: { title: true } })
    if (item) return { type, id, title: item.title }
  } else if (type === 'project') {
    const item = await db.project.findFirst({ where: { id, userId }, select: { title: true } })
    if (item) return { type, id, title: item.title }
  } else if (type === 'session') {
    const item = await db.focusSession.findFirst({
      where: { id, userId, outcome: { not: null } },
      select: { intention: true, endedAt: true, task: { select: { title: true } } },
    })
    if (item) {
      const day = item.endedAt ? dateKeyFromDate(item.endedAt, tz) : undefined
      return {
        type,
        id,
        title: `${item.task?.title ?? item.intention ?? 'Focus block'}${day ? ` · ${day}` : ''}`,
        observedAt: day,
      }
    }
  }
  throw new GrowthError(400, 'Choose a source from your own workspace')
}
