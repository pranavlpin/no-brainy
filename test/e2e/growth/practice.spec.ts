import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
const email = `growth-ui-${randomUUID()}@example.test`
test.afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw Error('Use isolated runner')
  const db = new PrismaClient()
  try {
    await db.user.deleteMany({ where: { email } })
  } finally {
    await db.$disconnect()
  }
})
test('connects a goal to a scheduled practice, focus result and lasting evidence', async ({
  page,
}) => {
  await page.goto('/register')
  await page.getByLabel('Name', { exact: true }).fill('Growth fixture')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('Test-only-password-918!')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page).toHaveURL(/\/today$/)
  await page.goto('/goals')
  await page.getByRole('button', { name: 'New Goal', exact: true }).click()
  await page.getByLabel('Title', { exact: true }).fill('Explain an idea clearly')
  await page
    .getByLabel('Success criteria', { exact: true })
    .fill('Explain it with one useful example')
  await page.getByLabel('Baseline', { exact: true }).fill('1')
  await page.getByLabel('Target measurement', { exact: true }).fill('5')
  await page.getByLabel('Measurement unit', { exact: true }).fill('examples')
  await page.getByLabel('Weekly practice target', { exact: true }).fill('3')
  await page.getByRole('button', { name: 'Create Goal', exact: true }).click()
  await page.getByRole('button', { name: /Explain an idea clearly/ }).click()
  await expect(
    page.getByRole('heading', { name: 'Explain an idea clearly', exact: true })
  ).toBeVisible()
  await expect(page.getByText('No measurement recorded yet.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Add next action', exact: true }).click()
  await page.getByLabel('Next action title', { exact: true }).fill('Write one clear example')
  await page.getByRole('button', { name: 'Plan for Today', exact: true }).click()
  await page.getByRole('button', { name: 'Create action', exact: true }).click()
  await expect(
    page.getByRole('link', { name: 'Write one clear example', exact: true })
  ).toBeVisible()
  await page.getByRole('button', { name: 'Focus on Write one clear example', exact: true }).click()
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.getByRole('button', { name: 'Finish session', exact: true }).click()
  await page.getByRole('button', { name: 'Completed', exact: true }).click()
  await expect(page.getByText('Result saved', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Back to my day', exact: true }).click()
  await expect(page.getByText('No measurement recorded yet.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Add evidence', exact: true }).click()
  await page
    .getByLabel('What did you observe?', { exact: true })
    .fill('The example made the idea easier to explain')
  await page.getByLabel('Observed measurement', { exact: true }).fill('2')
  await page.getByRole('button', { name: 'Save evidence', exact: true }).click()
  await page.reload()
  await expect(
    page.getByText('The example made the idea easier to explain', { exact: true })
  ).toBeVisible()
  await expect(page.getByTestId('goal-measurement')).toContainText('2 examples')
  await page.getByLabel('Goal status', { exact: true }).selectOption('paused')
  await expect(
    page.getByText('Practice is paused. Your history stays here.', { exact: true })
  ).toBeVisible()
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  )
  await page.goto('/growth')
  await expect(page.getByRole('heading', { name: 'Grow at your own pace.' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  )
})
