import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { processCaptureSchema } from '@/lib/validations/inbox'
import { inboxError, inboxFailure } from '@/lib/inbox/server'

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const id = req.nextUrl.pathname.split('/').at(-2)!
    const input = processCaptureSchema.parse(await req.json())
    const result = await prisma.$transaction(async (db) => {
      // Lock this owner's capture before reading its current conversion state.
      const locked = await db.capture.updateMany({
        where: { id, userId: user.id },
        data: { updatedAt: new Date() },
      })
      if (!locked.count) return { error: 'not-found' as const }
      const capture = await db.capture.findUniqueOrThrow({ where: { id } })
      if (input.kind === 'someday')
        return { capture: await db.capture.update({ where: { id }, data: { state: 'someday' } }) }
      if (capture.destinationId)
        return { capture: await db.capture.update({ where: { id }, data: { state: 'processed' } }) }
      const project = input.projectId
        ? await db.project.findFirst({ where: { id: input.projectId, userId: user.id } })
        : null
      if (input.projectId && !project) return { error: 'project' as const }
      const title = input.title ?? capture.content.split('\n')[0].slice(0, 200)
      const reference = `\n\n[Original capture](/inbox?capture=${id})`
      const source = capture.sourceUrl ? `\n\nSource: ${capture.sourceUrl}` : ''
      let destinationId: string
      if (input.kind === 'task') {
        const task = await db.task.create({
          data: {
            userId: user.id,
            title,
            descriptionMd: capture.content + source + reference,
            priority: input.priority,
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
            projectId: project?.id,
            context: project?.context,
            goalId: project?.goalId,
          },
        })
        if (project)
          await db.project.update({ where: { id: project.id }, data: { nextActionId: task.id } })
        destinationId = task.id
      } else if (input.kind === 'note') {
        const note = await db.note.create({
          data: {
            userId: user.id,
            title,
            contentMd: capture.content + source + reference,
            wordCount: capture.content.trim().split(/\s+/).length,
          },
        })
        if (project)
          await db.projectNote.create({ data: { projectId: project.id, noteId: note.id } })
        destinationId = note.id
      } else {
        const url = input.url ?? capture.sourceUrl
        if (!url) return { error: 'url' as const }
        destinationId = (
          await db.bookmark.create({
            data: {
              userId: user.id,
              title,
              url,
              description: capture.content.slice(0, 2000),
              tags: [],
            },
          })
        ).id
      }
      return {
        capture: await db.capture.update({
          where: { id },
          data: {
            state: 'processed',
            destinationId,
            destinationType: input.kind,
            processedAt: new Date(),
          },
        }),
      }
    })
    if (result.error)
      return result.error === 'not-found'
        ? inboxError('NOT_FOUND', 'Capture not found', 404)
        : inboxError(
            'INVALID_RELATION',
            result.error === 'project'
              ? 'Choose a project from your own workspace'
              : 'Add a valid web link to save a reference',
            400
          )
    return NextResponse.json({ success: true, data: result.capture })
  } catch (error) {
    return inboxFailure(error)
  }
})
