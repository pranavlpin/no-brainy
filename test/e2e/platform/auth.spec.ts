import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

const email = `platform-${randomUUID()}@example.test`

test.afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw new Error('An isolated test run is required')
  const prisma = new PrismaClient()
  try {
    await prisma.user.deleteMany({ where: { email } })
  } finally {
    await prisma.$disconnect()
  }
})

test('normal registration authenticates and a fresh browser cannot read private tasks', async ({
  page,
  request,
}) => {
  const unauthenticated = await request.get('/api/tasks')
  expect(unauthenticated.status()).toBe(401)
  const home = await page.goto('/')
  expect(home?.status()).toBe(200)
  await page.goto('/register')
  await page.getByLabel('Name', { exact: true }).fill('Test workspace')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('Test-only-password-918!')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page).toHaveURL(/\/(notes|today)$/)
  const authenticated = await page.request.get('/api/tasks')
  expect(authenticated.status()).toBe(200)
})
