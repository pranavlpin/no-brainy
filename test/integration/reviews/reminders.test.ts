import { randomUUID } from 'node:crypto'
import { beforeAll, afterAll, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { POST } from '@/app/api/notifications/generate/route'
import { GET as getPreferences } from '@/app/api/settings/notification-preferences/route'
const session = vi.hoisted(() => ({ id: '' }))
vi.mock('@/lib/auth/options', () => ({ auth: async () => ({ user: { id: session.id } }) }))
const req = () =>
  new NextRequest('http://localhost:3100/api/notifications/generate', { method: 'POST' })
beforeAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw Error('Use isolated runner')
  session.id = (
    await prisma.user.create({
      data: { email: `reminder-${randomUUID()}@example.test`, timezone: 'Asia/Kolkata' },
    })
  ).id
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-16T06:00:00Z'))
})
afterAll(async () => {
  vi.useRealTimers()
  if (process.env.NOBRAINY_TEST_RUN === '1')
    await prisma.user.deleteMany({ where: { id: session.id } })
  await prisma.$disconnect()
})
it('keeps new reminder preferences opt-in', async () => {
  expect((await (await getPreferences(req())).json()).data.enabled).toBe(false)
  expect((await (await POST(req())).json()).data.generated).toBe(0)
})
it('suppresses generation during the chosen quiet hours', async () => {
  await prisma.task.create({
    data: { userId: session.id, title: 'An active due task', dueDate: new Date('2026-10-16') },
  })
  await prisma.user.update({
    where: { id: session.id },
    data: {
      preferences: {
        notificationPreferences: {
          enabled: true,
          dueTasks: true,
          overdueTasks: false,
          habitReminders: false,
          flashcardReminders: false,
          dailyReviewReminders: false,
          quietHoursEnabled: true,
          quietStart: '00:00',
          quietEnd: '23:59',
        },
      },
    },
  })
  expect((await (await POST(req())).json()).data.generated).toBe(0)
})
it('excludes paused goals, paused routines and cancelled work while keeping an opted-in active reminder', async () => {
  await prisma.notification.deleteMany({ where: { userId: session.id } })
  const goal = await prisma.goal.create({
    data: { userId: session.id, title: 'A paused direction', status: 'paused' },
  })
  await prisma.task.createMany({
    data: [
      {
        userId: session.id,
        title: 'Paused goal task',
        goalId: goal.id,
        dueDate: new Date('2026-10-16'),
      },
      {
        userId: session.id,
        title: 'Paused routine',
        routinePaused: true,
        dueDate: new Date('2026-10-16'),
      },
      {
        userId: session.id,
        title: 'Cancelled task',
        status: 'cancelled',
        dueDate: new Date('2026-10-16'),
      },
    ],
  })
  await prisma.user.update({
    where: { id: session.id },
    data: {
      preferences: {
        notificationPreferences: {
          enabled: true,
          dueTasks: true,
          overdueTasks: false,
          habitReminders: false,
          flashcardReminders: false,
          dailyReviewReminders: false,
          quietHoursEnabled: false,
        },
      },
    },
  })
  expect((await (await POST(req())).json()).data.generated).toBe(1)
  expect((await (await POST(req())).json()).data.generated).toBe(0)
  expect(
    (await prisma.notification.findMany({ where: { userId: session.id } })).map((item) => item.body)
  ).toEqual(['An active due task'])
})
