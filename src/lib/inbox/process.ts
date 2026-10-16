/**
 * Transactional conversion of a capture into its destination.
 *
 * Ported from the owner's acceptance branch (`test/product-final-acceptance`,
 * NB-06) and adapted to this branch's task fields. The capture row is locked
 * first, the destination is written, and the capture is marked processed in
 * the same transaction; repeating the request returns the existing result.
 */
import type { Prisma } from '@prisma/client'
import { dateFromKey } from '@/lib/dates'
import { priorityRank } from '@/lib/tasks/priority'
import type { ProcessCaptureParsed } from '@/lib/validations/inbox'

type Db = Prisma.TransactionClient

export type ProcessOutcome =
  | { capture: Awaited<ReturnType<Db['capture']['update']>> }
  | { error: 'not-found' | 'url' }

function countWords(text: string): number {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

export async function processCapture(
  db: Db,
  userId: string,
  id: string,
  input: ProcessCaptureParsed
): Promise<ProcessOutcome> {
  // Lock the owner's row before reading its conversion state.
  const locked = await db.capture.updateMany({
    where: { id, userId },
    data: { updatedAt: new Date() },
  })
  if (!locked.count) return { error: 'not-found' }
  const capture = await db.capture.findUniqueOrThrow({ where: { id } })

  if (input.kind === 'someday') {
    return { capture: await db.capture.update({ where: { id }, data: { state: 'someday' } }) }
  }
  // Already converted: keep the existing destination and its edits.
  if (capture.destinationId) {
    return { capture: await db.capture.update({ where: { id }, data: { state: 'processed' } }) }
  }

  const title = input.title ?? capture.content.split('\n')[0].trim().slice(0, 200)
  const source = capture.sourceUrl ? `\n\nSource: ${capture.sourceUrl}` : ''
  const reference = `\n\n[Original capture](/inbox?capture=${id})`
  let destinationId: string

  if (input.kind === 'task') {
    const task = await db.task.create({
      data: {
        userId,
        title,
        descriptionMd: capture.content + source + reference,
        priority: input.priority,
        priorityRank: priorityRank(input.priority),
        plannedDate: input.plannedDate ? dateFromKey(input.plannedDate) : null,
        dueDate: input.dueDate ? dateFromKey(input.dueDate) : null,
      },
    })
    destinationId = task.id
  } else if (input.kind === 'note') {
    const body = capture.content + source + reference
    const note = await db.note.create({
      data: { userId, title, contentMd: body, wordCount: countWords(capture.content) },
    })
    destinationId = note.id
  } else {
    const url = input.url ?? capture.sourceUrl
    if (!url) return { error: 'url' }
    const bookmark = await db.bookmark.create({
      data: { userId, title, url, description: capture.content.slice(0, 2000), tags: [] },
    })
    destinationId = bookmark.id
  }

  return {
    capture: await db.capture.update({
      where: { id },
      data: {
        state: 'processed',
        destinationType: input.kind,
        destinationId,
        processedAt: new Date(),
      },
    }),
  }
}

/**
 * Undo a conversion: remove what processing created (only if the user still
 * owns it) and reopen the capture. The original text is never touched.
 */
export async function undoCapture(
  db: Db,
  userId: string,
  id: string
): Promise<ProcessOutcome> {
  const capture = await db.capture.findFirst({ where: { id, userId } })
  if (!capture) return { error: 'not-found' }
  if (capture.destinationId) {
    const where = { id: capture.destinationId, userId }
    if (capture.destinationType === 'task') await db.task.deleteMany({ where })
    else if (capture.destinationType === 'note') await db.note.deleteMany({ where })
    else if (capture.destinationType === 'bookmark') await db.bookmark.deleteMany({ where })
  }
  return {
    capture: await db.capture.update({
      where: { id },
      data: { state: 'inbox', destinationType: null, destinationId: null, processedAt: null },
    }),
  }
}
