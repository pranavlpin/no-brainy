import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
const email = `review-ui-${randomUUID()}@example.test`
test.afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw Error('Use isolated runner')
  const db = new PrismaClient()
  try {
    await db.user.deleteMany({ where: { email } })
  } finally {
    await db.$disconnect()
  }
})
test('closes an earlier day and a weekly adjustment without moving deadlines', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel('Name', { exact: true }).fill('Reflection fixture')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('Test-only-password-918!')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page).toHaveURL(/\/today$/)
  const response = await page.request.post('/api/tasks', {
    data: { title: 'A considered next step', dueDate: '2026-12-01' },
  })
  expect(response.ok()).toBe(true)
  const task = (await response.json()).data
  await page.goto('/reviews/daily?date=2026-10-12')
  await page
    .getByLabel('What moved forward?', { exact: true })
    .fill('I made space for focused work')
  await page.getByLabel('What got in the way?', { exact: true }).fill('Too many context switches')
  await page.getByRole('button', { name: 'Choose tomorrow’s first action', exact: true }).click()
  await page.getByRole('button', { name: 'Choose A considered next step', exact: true }).click()
  await page.getByRole('button', { name: 'Close this day', exact: true }).click()
  await expect(
    page.getByText('Day closed. You can return whenever you need.', { exact: true })
  ).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('What moved forward?', { exact: true })).toHaveValue(
    'I made space for focused work'
  )
  let saved = (await (await page.request.get(`/api/tasks/${task.id}`)).json()).data
  expect(saved.plannedDate).toBe('2026-10-13')
  expect(saved.dueDate.slice(0, 10)).toBe('2026-12-01')
  await page.goto('/reviews/weekly?date=2026-10-12')
  await page.getByLabel('Stop', { exact: true }).fill('Opening every notification')
  await page.getByLabel('Keep', { exact: true }).fill('One protected focus session')
  await page.getByLabel('Try', { exact: true }).fill('A quieter start')
  await page.getByLabel('Next-week outcome 1', { exact: true }).fill('Finish a useful draft')
  await page.getByRole('button', { name: 'Choose next week’s first action', exact: true }).click()
  await page.getByRole('button', { name: 'Choose A considered next step', exact: true }).click()
  await page.getByRole('button', { name: 'Save weekly adjustment', exact: true }).click()
  await expect(
    page.getByText('Weekly adjustment saved. Leave room for life.', { exact: true })
  ).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Try', { exact: true })).toHaveValue('A quieter start')
  saved = (await (await page.request.get(`/api/tasks/${task.id}`)).json()).data
  expect(saved.plannedDate).toBe('2026-10-19')
  expect(saved.dueDate.slice(0, 10)).toBe('2026-12-01')
  await page.goto('/today')
  await page.getByLabel('Planning date', { exact: true }).fill('2026-10-19')
  await expect(page.getByText('A considered next step', { exact: true }).first()).toBeVisible()
})
