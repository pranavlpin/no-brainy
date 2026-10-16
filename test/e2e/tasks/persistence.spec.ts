import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

const email = `reliability-${randomUUID()}@example.test`
test.afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw new Error('Isolated runner required')
  const prisma = new PrismaClient()
  try {
    await prisma.user.deleteMany({ where: { email } })
  } finally {
    await prisma.$disconnect()
  }
})

test('task dates and simultaneous edits persist; a note saves when leaving immediately', async ({
  page,
}) => {
  page.on('pageerror', (error) => {
    void test
      .info()
      .attach('browser-error', { body: error.stack ?? error.message, contentType: 'text/plain' })
  })
  await page.goto('/register')
  await page.getByLabel('Name', { exact: true }).fill('Reliability fixture')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('Test-only-password-918!')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page).toHaveURL(/\/(notes|today)$/)
  await page.goto('/tasks')
  await page.getByRole('button', { name: 'New Task', exact: true }).click()
  await page.getByLabel('Title *', { exact: true }).fill('Browser task')
  await page.getByLabel('Due Date', { exact: true }).fill('2026-10-20')
  await page.getByRole('button', { name: 'Create Task', exact: true }).click()
  await page.getByRole('link', { name: 'Browser task', exact: true }).click()
  await expect(page).toHaveURL(/\/tasks\/[^/]+$/)
  await expect(page.getByLabel('Task title', { exact: true })).toBeVisible()
  await page.getByLabel('Task title', { exact: true }).fill('Edited title persists')
  await page.getByLabel('Priority', { exact: true }).selectOption('urgent')
  await expect(page.getByTestId('save-status')).toContainText('Saved')
  await page.reload()
  await expect(page.getByLabel('Task title', { exact: true })).toHaveValue('Edited title persists')
  await expect(page.getByLabel('Priority', { exact: true })).toHaveValue('urgent')
  await expect(page.getByLabel('Due Date', { exact: true })).toHaveValue('2026-10-20')
  const note = await page.request.post('/api/notes', { data: { title: 'Browser note' } })
  expect(note.status()).toBe(201)
  const id = (await note.json()).data.id as string
  await page.goto(`/notes/${id}`)
  await page.getByLabel('Note title', { exact: true }).fill('Saved during navigation')
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await expect
    .poll(async () => (await (await page.request.get(`/api/notes/${id}`)).json()).data.title)
    .toBe('Saved during navigation')
  await page.goto(`/notes/${id}`)
  await expect(page.getByLabel('Note title', { exact: true })).toHaveValue(
    'Saved during navigation'
  )
})
