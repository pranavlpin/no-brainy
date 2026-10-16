import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

const email = `today-ui-${randomUUID()}@example.test`
test.afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw new Error('Isolated runner required')
  const prisma = new PrismaClient()
  try {
    await prisma.user.deleteMany({ where: { email } })
  } finally {
    await prisma.$disconnect()
  }
})

test('plans an undated action beyond page one, budgets a smaller day and starts Focus directly', async ({
  page,
}) => {
  await page.goto('/register')
  await page.getByLabel('Name', { exact: true }).fill('Today fixture')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('Test-only-password-918!')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page).toHaveURL(/\/today$/)
  const goalResponse = await page.request.post('/api/goals', {
    data: { title: 'Practice clear writing' },
  })
  const goal = (await goalResponse.json()).data
  for (let index = 0; index < 24; index++)
    await page.request.post('/api/tasks', { data: { title: `Earlier option ${index}` } })
  const action = await page.request.post('/api/tasks', {
    data: { title: 'Write a thoughtful paragraph', goalId: goal.id, estimatedMinutes: 30 },
  })
  expect(action.status()).toBe(201)
  await page.reload()
  await expect(page.getByLabel('Main outcome', { exact: true })).toBeVisible()
  await page
    .getByLabel('Main outcome', { exact: true })
    .fill('Make a small piece of writing clearer')
  await page.getByRole('button', { name: 'Choose a priority', exact: true }).click()
  await page.getByLabel('Search active tasks', { exact: true }).fill('thoughtful paragraph')
  await page
    .getByRole('button', { name: 'Choose Write a thoughtful paragraph', exact: true })
    .click()
  await page.getByLabel('Available minutes', { exact: true }).fill('60')
  await page.getByLabel('Buffer minutes', { exact: true }).fill('10')
  await expect(page.getByTestId('save-status')).toContainText('Saved')
  await page.getByRole('button', { name: 'Add time block', exact: true }).click()
  await page.getByLabel('Block title', { exact: true }).fill('Writing practice')
  await page.getByLabel('Start time', { exact: true }).fill('10:00')
  await page.getByLabel('End time', { exact: true }).fill('10:30')
  await page.getByRole('button', { name: 'Save time block', exact: true }).click()
  await expect(page.getByTestId('save-status')).toContainText('Saved')
  await page.reload()
  await expect(page.getByLabel('Main outcome', { exact: true })).toHaveValue(
    'Make a small piece of writing clearer'
  )
  await expect(page.getByLabel('Available minutes', { exact: true })).toHaveValue('60')
  await expect(page.getByText('Writing practice', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Edit Writing practice', exact: true }).click()
  await page.getByLabel('Block title', { exact: true }).fill('A revised writing block')
  await page.getByLabel('End time', { exact: true }).fill('10:45')
  await page.getByRole('button', { name: 'Save time block', exact: true }).click()
  await expect(page.getByText('A revised writing block', { exact: true })).toBeVisible()
  await expect(page.getByTestId('save-status')).toContainText('Saved')
  await page.getByRole('button', { name: 'Delete A revised writing block', exact: true }).click()
  await page.getByRole('button', { name: 'Remove block', exact: true }).click()
  await expect(page.getByText('A revised writing block', { exact: true })).not.toBeVisible()
  await expect(page.getByTestId('save-status')).toContainText('Saved')
  await page
    .getByRole('button', { name: 'Complete Write a thoughtful paragraph', exact: true })
    .click()
  await expect(
    page.getByRole('button', {
      name: 'Undo completion of Write a thoughtful paragraph',
      exact: true,
    })
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Undo completion of Write a thoughtful paragraph', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Complete Write a thoughtful paragraph', exact: true })
  ).toBeVisible()
  await page.getByRole('button', { name: 'Start Focus', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Write a thoughtful paragraph', exact: true })
  ).toBeVisible()
})
