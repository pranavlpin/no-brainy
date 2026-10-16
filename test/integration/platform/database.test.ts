import { randomUUID } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const prisma = new PrismaClient()
const email = `database-${randomUUID()}@example.test`

beforeAll(() => {
  if (process.env.NOBRAINY_TEST_RUN !== '1')
    throw new Error('Use the isolated database test runner')
})

afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN === '1') await prisma.user.deleteMany({ where: { email } })
  await prisma.$disconnect()
})

describe('migrated disposable PostgreSQL database', () => {
  it('persists an owned task and reads it through a separate query', async () => {
    const user = await prisma.user.create({ data: { email, name: 'Database fixture' } })
    const task = await prisma.task.create({
      data: { title: 'Verify persistence', userId: user.id },
    })
    const restored = await prisma.task.findFirst({ where: { id: task.id, userId: user.id } })
    expect(restored?.title).toBe('Verify persistence')
    expect(
      await prisma.task.findFirst({ where: { id: task.id, userId: 'different-owner' } })
    ).toBeNull()
  })
})
