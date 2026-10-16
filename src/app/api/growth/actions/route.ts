import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { growthActionSchema } from '@/lib/validations/growth'
import { GrowthError, growthFailure, ownedGrowthSource } from '@/lib/growth/server'
import { serializeTask } from '@/lib/tasks/serialize'
import { initializeRoutine } from '@/lib/tasks/routine-service'
import { todayInTimezone } from '@/lib/dates/calendar'
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const input = growthActionSchema.parse(await req.json())
    const id = `ga${createHash('sha256')
      .update(JSON.stringify([user.id, input.clientRequestId]))
      .digest('hex')}`
    const result = await prisma.$transaction(async (db) => {
      await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
      const prior = await db.task.findUnique({ where: { id } })
      if (prior) return prior
      if (
        input.goalId &&
        !(await db.goal.findFirst({
          where: { id: input.goalId, userId: user.id, status: 'active' },
        }))
      )
        throw new GrowthError(400, 'Choose an active goal from your workspace')
      const source =
        input.sourceType && input.sourceId
          ? await ownedGrowthSource(db, user.id, input.sourceType, input.sourceId, user.timezone)
          : null
      let task = await db.task.create({
        data: {
          id,
          userId: user.id,
          title: input.title,
          goalId: input.goalId,
          context: 'personal',
          plannedDate: input.plannedDate ? new Date(`${input.plannedDate}T00:00:00Z`) : null,
          estimatedMinutes: input.estimatedMinutes,
          rrule: input.rrule,
          isRecurring: !!input.rrule,
          descriptionMd: [
            input.description,
            source
              ? `[Learning source: ${source.title}](${source.href})\n\n${source.content.slice(0, 10000)}`
              : '',
            'After trying it: record what happened as evidence on your growth goal.',
          ]
            .filter(Boolean)
            .join('\n\n'),
        },
      })
      if (source)
        await db.taskLink.create({
          data: { taskId: id, linkedType: input.sourceType!, linkedId: source.id },
        })
      if (task.plannedDate)
        await db.taskPlanEvent.create({
          data: {
            userId: user.id,
            taskId: id,
            taskTitle: task.title,
            fromDate: null,
            toDate: task.plannedDate,
          },
        })
      task = await initializeRoutine(db, task, todayInTimezone(user.timezone))
      return task
    })
    return NextResponse.json({ success: true, data: serializeTask(result) }, { status: 201 })
  } catch (error) {
    return growthFailure(error)
  }
})
