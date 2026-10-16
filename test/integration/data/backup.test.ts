import { randomUUID } from 'node:crypto'
import { beforeAll, afterAll, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exportWorkspace, previewImport, importWorkspace } from '@/lib/data/backup'
import { parseBackup } from '@/lib/validations/backup'
import { GET as exportRoute } from '@/app/api/data/export/route'
import { GET as readSetup, PATCH as saveSetup } from '@/app/api/settings/personal/route'
import { POST as createTask } from '@/app/api/tasks/route'
import { readDayPlan } from '@/lib/planner/server'
const session = vi.hoisted(() => ({ id: '' }))
vi.mock('@/lib/auth/options', () => ({
  auth: async () => (session.id ? { user: { id: session.id } } : null),
}))
let source = '',
  target = ''
beforeAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw Error('Use isolated runner')
  source = (
    await prisma.user.create({
      data: {
        email: `source-${randomUUID()}@example.test`,
        passwordHash: 'private-hash',
        preferences: { openaiApiKey: 'private-key' },
      },
    })
  ).id
  target = (await prisma.user.create({ data: { email: `target-${randomUUID()}@example.test` } })).id
  const goal = await prisma.goal.create({
    data: { userId: source, title: 'Grow steadily', baseline: 1, target: 4 },
  })
  const project = await prisma.project.create({
    data: { userId: source, title: 'Practice project', goalId: goal.id },
  })
  const note = await prisma.note.create({
    data: {
      userId: source,
      title: 'Source note',
      contentMd: '**Useful**',
      isPublic: true,
      shareId: randomUUID(),
    },
  })
  const second = await prisma.note.create({ data: { userId: source, title: 'Linked note' } })
  await prisma.noteLink.create({
    data: { sourceId: note.id, targetType: 'note', targetId: second.id },
  })
  const task = await prisma.task.create({
    data: {
      userId: source,
      title: 'Practice',
      projectId: project.id,
      goalId: goal.id,
      isRecurring: true,
      rrule: 'FREQ=DAILY',
      recurrenceAnchor: new Date('2026-10-16'),
      occurrenceDate: new Date('2026-10-16'),
    },
  })
  await prisma.task.create({
    data: {
      userId: source,
      title: 'Next practice',
      routineId: task.id,
      parentTaskId: task.id,
      occurrenceDate: new Date('2026-10-17'),
    },
  })
  await prisma.task.update({ where: { id: task.id }, data: { routineId: task.id } })
  await prisma.project.update({ where: { id: project.id }, data: { nextActionId: task.id } })
  await prisma.projectNote.create({ data: { projectId: project.id, noteId: note.id } })
  await prisma.taskLink.create({ data: { taskId: task.id, linkedType: 'note', linkedId: note.id } })
  await prisma.capture.create({
    data: {
      userId: source,
      clientRequestId: randomUUID(),
      content: 'Original idea',
      state: 'processed',
      destinationType: 'task',
      destinationId: task.id,
    },
  })
  await prisma.dayPlan.create({
    data: {
      userId: source,
      planDate: new Date('2026-10-16'),
      focusTaskIds: [task.id],
      growthTaskId: task.id,
      timeBlocks: [
        {
          id: 'block',
          title: 'Practice',
          startTime: '09:00',
          endTime: '09:30',
          taskId: task.id,
          isCompleted: false,
        },
      ],
    },
  })
  await prisma.dailyReview.create({
    data: {
      userId: source,
      reviewDate: new Date('2026-10-16'),
      whatMoved: 'A small step',
      tomorrowTaskId: task.id,
    },
  })
  await prisma.weeklyReview.create({
    data: {
      userId: source,
      weekStart: new Date('2026-10-12'),
      nextTaskId: task.id,
      keepDoing: 'Small steps',
    },
  })
  const focus = await prisma.focusSession.create({
    data: {
      userId: source,
      clientRequestId: randomUUID(),
      taskId: task.id,
      taskTitle: task.title,
      activeOwner: source,
      plannedSeconds: 1500,
      accumulatedSeconds: 40,
      state: 'paused',
    },
  })
  await prisma.growthEvidence.create({
    data: {
      userId: source,
      clientRequestId: randomUUID(),
      goalId: goal.id,
      observedAt: new Date('2026-10-16'),
      summary: 'I practiced',
      sourceType: 'session',
      sourceId: focus.id,
      sourceTitle: task.title,
      practiceKey: `task:${task.id}`,
    },
  })
  await prisma.taskPlanEvent.create({
    data: {
      userId: source,
      taskId: task.id,
      taskTitle: task.title,
      toDate: new Date('2026-10-16'),
    },
  })
})
afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [source, target] } } })
  await prisma.$disconnect()
})
it('exports only core fields and remaps all internal relationships atomically and idempotently', async () => {
  const backup = await exportWorkspace(source)
  const text = JSON.stringify(backup)
  expect(text).not.toMatch(/private-hash|private-key|passwordHash|shareId|activeOwner|userId/)
  expect(backup.version).toBe(1)
  const preview = await previewImport(target, backup)
  expect(await prisma.task.count({ where: { userId: target } })).toBe(0)
  const requestId = randomUUID()
  const result = await importWorkspace(target, backup, requestId, preview.fingerprint)
  expect(result.imported.tasks).toBe(2)
  await importWorkspace(target, backup, requestId, preview.fingerprint)
  await importWorkspace(target, backup, randomUUID(), preview.fingerprint)
  expect(await prisma.task.count({ where: { userId: target } })).toBe(2)
  const task = await prisma.task.findFirstOrThrow({
    where: { userId: target, title: 'Practice' },
    include: { project: true, taskLinks: true },
  })
  expect(task.id).not.toBe(backup.data.tasks[0].id)
  expect(task.project?.nextActionId).toBe(task.id)
  expect(task.project?.goalId).toBe(task.goalId)
  expect(task.routineId).toBe(task.id)
  const child = await prisma.task.findFirstOrThrow({
    where: { userId: target, title: 'Next practice' },
  })
  expect(child.parentTaskId).toBe(task.id)
  expect(child.routineId).toBe(task.id)
  const plan = await prisma.dayPlan.findFirstOrThrow({ where: { userId: target } })
  expect(plan.focusTaskIds).toEqual([task.id])
  expect(plan.growthTaskId).toBe(task.id)
  expect(plan.timeBlocks).toEqual(
    expect.arrayContaining([expect.objectContaining({ taskId: task.id })])
  )
  expect(
    (await prisma.dailyReview.findFirstOrThrow({ where: { userId: target } })).tomorrowTaskId
  ).toBe(task.id)
  expect(
    (await prisma.weeklyReview.findFirstOrThrow({ where: { userId: target } })).nextTaskId
  ).toBe(task.id)
  const note = await prisma.note.findFirstOrThrow({
    where: { userId: target, title: 'Source note' },
  })
  expect(note.isPublic).toBe(false)
  expect(note.shareId).toBeNull()
  expect(task.taskLinks[0].linkedId).toBe(note.id)
  const focus = await prisma.focusSession.findFirstOrThrow({ where: { userId: target } })
  expect(focus.state).toBe('finished')
  expect(focus.activeOwner).toBeNull()
  expect(focus.accumulatedSeconds).toBe(40)
  const evidence = await prisma.growthEvidence.findFirstOrThrow({ where: { userId: target } })
  expect(evidence.sourceId).toBe(focus.id)
  expect(evidence.practiceKey).toBe(`task:${task.id}`)
  const changed = structuredClone(backup)
  changed.data.tasks[0].title = 'Different payload'
  await expect(importWorkspace(target, changed, requestId, preview.fingerprint)).rejects.toThrow(
    /request/i
  )
})
it('rejects invalid versions, oversized input, dangling references and cycles before mutation', async () => {
  const backup = await exportWorkspace(source)
  expect(() => parseBackup(JSON.stringify({ ...backup, version: 999 }))).toThrow()
  expect(() => parseBackup(' '.repeat(10 * 1024 * 1024 + 1))).toThrow(/large/i)
  const before = await prisma.task.count({ where: { userId: target } })
  const broken = structuredClone(backup)
  broken.data.tasks[0].goalId = 'not-in-backup'
  await expect(previewImport(target, broken)).rejects.toThrow(/reference/i)
  const cycle = structuredClone(backup)
  cycle.data.tasks[0].parentTaskId = cycle.data.tasks[0].id
  await expect(previewImport(target, cycle)).rejects.toThrow(/cycle/i)
  expect(await prisma.task.count({ where: { userId: target } })).toBe(before)
})
it('previews skipped dates, rejects a stale preview and rolls back database failures', async () => {
  const backup = await exportWorkspace(source)
  const preview = await previewImport(target, backup)
  expect(preview.skipped.dayPlans).toEqual(['2026-10-16'])
  await prisma.dayPlan.deleteMany({ where: { userId: target } })
  const changed = structuredClone(backup)
  changed.exportedAt = '2026-10-17T00:00:00.000Z'
  await expect(importWorkspace(target, changed, randomUUID(), preview.fingerprint)).rejects.toThrow(
    /preview/i
  )
  const fresh = await previewImport(target, changed)
  const before = await prisma.task.count({ where: { userId: target } })
  const fail = vi.spyOn(prisma, '$transaction').mockImplementationOnce(async (callback) => {
    return prisma.$transaction(async (db) => {
      await (callback as (client: typeof db) => Promise<unknown>)(db)
      throw Error('Simulated storage failure')
    }) as never
  })
  await expect(importWorkspace(target, changed, randomUUID(), fresh.fingerprint)).rejects.toThrow(
    'Simulated storage failure'
  )
  fail.mockRestore()
  expect(await prisma.task.count({ where: { userId: target } })).toBe(before)
})
it('rejects contradictory calendar windows and duplicate internal link identities during preview', async () => {
  const backup = await exportWorkspace(source)
  const invalidWindow = structuredClone(backup)
  invalidWindow.data.dayPlans[0].workStart = '18:00'
  invalidWindow.data.dayPlans[0].workEnd = '09:00'
  await expect(previewImport(target, invalidWindow)).rejects.toThrow(/window/i)
  const duplicateLink = structuredClone(backup)
  duplicateLink.data.taskLinks.push(duplicateLink.data.taskLinks[0])
  await expect(previewImport(target, duplicateLink)).rejects.toThrow(/duplicate/i)
  const duplicateOccurrence = structuredClone(backup)
  const routine = duplicateOccurrence.data.tasks.find((t) => t.routineId === t.id)!
  const occurrence = duplicateOccurrence.data.tasks.find((t) => t.id !== routine.id)!
  occurrence.occurrenceDate = routine.occurrenceDate
  await expect(previewImport(target, duplicateOccurrence)).rejects.toThrow(/occurrence/i)
})
it('requires authentication, ignores foreign-owner selectors and stores safe personal settings', async () => {
  session.id = ''
  expect((await exportRoute(new NextRequest('http://localhost/api/data/export'))).status).toBe(401)
  session.id = target
  const response = await exportRoute(
    new NextRequest(`http://localhost/api/data/export?userId=${source}`)
  )
  expect((await response.json()).data.tasks).toHaveLength(2)
  session.id = source
  const patch = new NextRequest('http://localhost/api/settings/personal', {
    method: 'PATCH',
    body: JSON.stringify({
      timezone: 'Asia/Kolkata',
      defaultContext: 'personal',
      availableMinutes: 90,
      reduceMotion: true,
      sound: false,
      workStart: '09:00',
      workEnd: '17:00',
    }),
  })
  expect((await saveSetup(patch)).status).toBe(200)
  const settings = await (
    await readSetup(new NextRequest('http://localhost/api/settings/personal'))
  ).json()
  expect(settings.data).toMatchObject({
    timezone: 'Asia/Kolkata',
    reduceMotion: true,
    availableMinutes: 90,
  })
  expect(JSON.stringify(settings)).not.toContain('private-key')
  expect(
    (await prisma.user.findUniqueOrThrow({ where: { id: source } })).preferences
  ).toMatchObject({ openaiApiKey: 'private-key' })
  const task = await (
    await createTask(
      new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: 'Uses my default' }),
      })
    )
  ).json()
  expect(task.data.context).toBe('personal')
  const plan = await readDayPlan(prisma, source, '2026-10-20')
  expect(plan.availableMinutes).toBe(90)
  expect(plan.workEnd).toBe('17:00')
  expect((await readDayPlan(prisma, source, '2026-10-16')).availableMinutes).toBe(180)
})
