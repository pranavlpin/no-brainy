import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { growthQuerySchema } from '@/lib/validations/growth'
import {
  goalInclude,
  GrowthError,
  growthFailure,
  needsPractice,
  practiceTask,
  serializeGoal,
} from '@/lib/growth/server'
import { practiceCount, weekStartFor } from '@/lib/growth/progress'
import { addCalendarDays, todayInTimezone } from '@/lib/dates/calendar'
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const input = growthQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    const today = todayInTimezone(user.timezone)
    const weekStart = weekStartFor(input.week ?? today)
    const weekEnd = addCalendarDays(weekStart, 7)
    const goals = await prisma.goal.findMany({
      where: { userId: user.id, ...(input.goalId && { id: input.goalId }) },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      include: {
        ...goalInclude,
        tasks: true,
        projects: {
          where: { userId: user.id },
          include: {
            notes: {
              include: {
                note: { select: { id: true, title: true, isDeleted: true, userId: true } },
              },
            },
          },
        },
        _count: { select: { evidence: true } },
      },
    })
    if (input.goalId && !goals.length) throw new GrowthError(404, 'Goal not found')
    const items = await Promise.all(
      goals.map(async (goal) => {
        const [evidence, sessions, linked, noteEvidence] = await Promise.all([
          prisma.growthEvidence.findMany({
            where: {
              userId: user.id,
              goalId: goal.id,
              observedAt: { gte: new Date(weekStart), lt: new Date(weekEnd) },
            },
          }),
          prisma.focusSession.findMany({
            where: {
              userId: user.id,
              state: 'finished',
              task: { goalId: goal.id },
              completedAt: {
                gte: new Date(addCalendarDays(weekStart, -2)),
                lt: new Date(addCalendarDays(weekEnd, 2)),
              },
            },
            include: { task: true },
          }),
          prisma.taskLink.findMany({
            where: { task: { userId: user.id, goalId: goal.id }, linkedType: 'note' },
            select: { linkedId: true },
          }),
          prisma.growthEvidence.findMany({
            where: {
              userId: user.id,
              goalId: goal.id,
              sourceType: 'note',
              sourceId: { not: null },
            },
            select: { sourceId: true },
          }),
        ])
        const count = practiceCount({
          weekStart,
          timezone: user.timezone,
          tasks: goal.tasks.map(practiceTask),
          sessions: sessions.map((item) => ({
            ...item,
            completedAt: item.completedAt?.toISOString() ?? null,
            task: item.task ? practiceTask(item.task) : null,
          })),
          evidence: evidence.map((item) => ({
            ...item,
            observedAt: item.observedAt.toISOString().slice(0, 10),
          })),
        })
        const noteIds = [
          ...new Set([
            ...linked.map((item) => item.linkedId),
            ...goal.projects.flatMap((project) => project.notes.map((link) => link.noteId)),
            ...noteEvidence.map((item) => item.sourceId!),
          ]),
        ]
        const notes = noteIds.length
          ? await prisma.note.findMany({
              where: { userId: user.id, id: { in: noteIds }, isDeleted: false },
              select: { id: true, title: true },
            })
          : []
        const { projects: _projects, _count: _count, ...core } = goal
        const serial = await serializeGoal(core)
        return {
          ...serial,
          practiceCount: count,
          needsPractice: needsPractice(goal, count),
          evidenceCount: goal._count.evidence,
          projects: goal.projects.map((project) => ({
            id: project.id,
            title: project.title,
            status: project.status,
          })),
          notes,
        }
      })
    )
    const dueLearning = await prisma.flashcard.count({
      where: { userId: user.id, nextReviewAt: { lte: new Date(today) } },
    })
    return NextResponse.json({
      success: true,
      data: { today, timezone: user.timezone, weekStart, weekEnd, goals: items, dueLearning },
    })
  } catch (error) {
    return growthFailure(error)
  }
})
