import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
const email = `focus-ui-${randomUUID()}@example.test`
test.afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw Error('Isolated runner required')
  const db = new PrismaClient()
  try {
    await db.user.deleteMany({ where: { email } })
  } finally {
    await db.$disconnect()
  }
})
test('keeps intention and active time outside Focus and across reload, then records partial progress once', async ({
  page,
}) => {
  await page.goto('/register')
  await page.getByLabel('Name', { exact: true }).fill('Focus fixture')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('Test-only-password-918!')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page).toHaveURL(/\/today$/)
  const response = await page.request.post('/api/tasks', { data: { title: 'Practise patiently' } })
  const task = (await response.json()).data
  await page.goto(`/tasks/${task.id}`)
  await page.getByRole('button', { name: 'Focus', exact: true }).click()
  await page.getByLabel('Session intention', { exact: true }).fill('Understand one small idea')
  await page.getByRole('button', { name: 'Exit focus mode' }).click()
  await page.getByRole('button', { name: 'Focus', exact: true }).click()
  await expect(page.getByLabel('Session intention', { exact: true })).toHaveValue(
    'Understand one small idea'
  )
  await page.getByRole('button', { name: '50 minutes', exact: true }).click()
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  await expect(page.getByText('Paused', { exact: true })).toBeVisible()
  const before = (await (await page.request.get('/api/focus')).json()).data.active
  await page.getByRole('button', { name: 'Exit focus mode' }).click()
  await expect(page.getByTestId('compact-focus-timer')).toContainText('Paused')
  await page.reload()
  await expect(page.getByTestId('compact-focus-timer')).toContainText('Paused')
  await page.getByRole('button', { name: 'Open focus session' }).click()
  const after = (await (await page.request.get('/api/focus')).json()).data.active
  expect(after.accumulatedSeconds).toBe(before.accumulatedSeconds)
  await page.getByRole('button', { name: 'Resume', exact: true }).click()
  await page.getByRole('button', { name: 'Finish session', exact: true }).click()
  await page.getByLabel('Session result', { exact: true }).fill('I understood the first example')
  await page.getByRole('button', { name: 'Made progress', exact: true }).click()
  await expect(page.getByText('Result saved', { exact: true })).toBeVisible()
  const saved = (await (await page.request.get('/api/tasks/' + task.id)).json()).data
  expect(saved.status).toBe('pending')
  const focus = (await (await page.request.get('/api/focus')).json()).data
  expect(focus.active).toBeNull()
  expect(focus.recent).toHaveLength(1)
  expect(focus.recent[0].outcome).toBe('progress')
  await page.getByRole('button', { name: 'Choose another session', exact: true }).click()
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.getByRole('button', { name: 'Finish session', exact: true }).click()
  await page
    .getByLabel('Session result', { exact: true })
    .fill('Keep this result through a lost response')
  await page.route('**/api/focus', async (route) => {
    if (
      route.request().method() === 'PATCH' &&
      route.request().postDataJSON().action === 'finish'
    ) {
      await route.fetch()
      await route.abort('failed')
    } else await route.continue()
  })
  await page.getByRole('button', { name: 'Made progress', exact: true }).click()
  await expect(
    page
      .getByText('Connection interrupted. Your session input is kept; retry when connected.', {
        exact: true,
      })
      .first()
  ).toBeVisible()
  await page.unroute('**/api/focus')
  await expect(page.getByRole('dialog', { name: 'What moved forward?' })).not.toBeVisible()
  await page.getByRole('button', { name: 'Exit focus mode' }).click()
  await page.reload()
  await expect(page.getByTestId('compact-focus-timer')).toContainText('Not yet saved')
  await page.getByRole('button', { name: 'Open focus session' }).click()
  await page.getByRole('button', { name: 'Retry save / connection', exact: true }).click()
  await expect(page.getByText('Result saved', { exact: true })).toBeVisible()
  await expect(
    page.getByText('Keep this result through a lost response', { exact: true })
  ).toBeVisible()
  const recovered = (await (await page.request.get('/api/focus')).json()).data
  expect(recovered.recent).toHaveLength(2)
})
