import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
const email = `library-loop-${randomUUID()}@example.test`
test.afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw Error('Use isolated runner')
  const db = new PrismaClient()
  try {
    await db.user.deleteMany({ where: { email } })
  } finally {
    await db.$disconnect()
  }
})
test('carries a learning source through action, focus and reflection', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel('Name', { exact: true }).fill('Learning loop')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('Test-only-password-918!')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page).toHaveURL(/\/today$/)
  const response = await page.request.post('/api/books', { data: { title: 'Ideas worth trying' } })
  expect(response.status()).toBe(201)
  const book = (await response.json()).data
  await page.request.patch(`/api/books/${book.id}`, {
    data: { applicationMd: 'Try one explanation with an example' },
  })
  await page.goto(`/books/${book.id}`)
  await page.getByRole('button', { name: "How I'll Apply This", exact: true }).click()
  await page.getByRole('button', { name: 'Turn into an experiment', exact: true }).click()
  await page.getByLabel('Next action title', { exact: true }).fill('Explain one small idea')
  await page.getByRole('button', { name: 'Plan for Today', exact: true }).click()
  await page.getByRole('button', { name: 'Create action', exact: true }).click()
  await page.getByRole('link', { name: 'Open your experiment', exact: true }).click()
  await expect(page).toHaveURL(/\/tasks\/[^/]+$/)
  const id = page.url().split('/').at(-1)!
  await page.getByRole('button', { name: 'Focus', exact: true }).click()
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.getByRole('button', { name: 'Finish session', exact: true }).click()
  await page.getByLabel('Session result', { exact: true }).fill('The example made it clearer')
  await page.getByRole('button', { name: 'Made progress', exact: true }).click()
  await expect(page.getByText('Result saved', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Back to my day', exact: true }).click()
  const focus = (await (await page.request.get('/api/focus')).json()).data.recent[0]
  await page.goto('/reviews/daily')
  await expect(page.getByTestId(`review-session-${focus.id}`)).toContainText(
    'The example made it clearer'
  )
  await page
    .getByLabel('What moved forward?', { exact: true })
    .fill('Applied one idea from my reading')
  await page.getByRole('button', { name: 'Close this day', exact: true }).click()
  await expect(
    page.getByText('Day closed. You can return whenever you need.', { exact: true })
  ).toBeVisible()
  const task = (await (await page.request.get(`/api/tasks/${id}`)).json()).data
  expect(task.taskLinks).toEqual(
    expect.arrayContaining([expect.objectContaining({ linkedType: 'book', linkedId: book.id })])
  )
  expect(task.status).toBe('pending')
})
