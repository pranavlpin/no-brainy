import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
const email = `whole-day-${randomUUID()}@example.test`
test.afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw Error('Isolated runner required')
  const db = new PrismaClient()
  try {
    await db.user.deleteMany({ where: { email } })
  } finally {
    await db.$disconnect()
  }
})
test('a 50-task workspace supports capture, retry, daily focus, growth evidence and a weekly adjustment without AI', async ({
  page,
}) => {
  test.setTimeout(180000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/register')
  await page.getByLabel('Name', { exact: true }).fill('Whole day')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('Test-only-password-918!')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page).toHaveURL(/\/today$/)
  expect((await (await page.request.get('/api/settings/api-key')).json()).data.hasKey).toBe(false)
  const goal = (
    await (
      await page.request.post('/api/goals', {
        data: { title: 'Build useful skills', baseline: 0, target: 5, unit: 'experiments' },
      })
    ).json()
  ).data
  const project = (
    await (
      await page.request.post('/api/projects', {
        data: {
          title: 'A useful project',
          goalId: goal.id,
          context: 'personal',
          outcome: 'Try one useful idea',
        },
      })
    ).json()
  ).data
  for (let n = 1; n <= 49; n++)
    expect(
      (
        await page.request.post('/api/tasks', {
          data: { title: `Backlog ${String(n).padStart(2, '0')}` },
        })
      ).status()
    ).toBe(201)
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k')
  await page.getByLabel('Capture text').fill('Z useful experiment')
  await page.getByRole('button', { name: 'Save to Inbox', exact: true }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.goto('/inbox')
  await page.getByRole('button', { name: 'Process capture', exact: true }).click()
  await page.getByLabel('Save as', { exact: true }).selectOption('task')
  await page.getByLabel('Project', { exact: true }).selectOption(project.id)
  const processed = page.waitForResponse(
    (response) => response.url().includes('/process') && response.request().method() === 'POST'
  )
  await page.getByRole('button', { name: 'Save & next', exact: true }).click()
  expect((await processed).status()).toBe(200)
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.goto('/tasks')
  await expect(page.getByRole('navigation', { name: 'Task pages' })).toContainText('50 tasks')
  await page.getByLabel('Sort tasks', { exact: true }).selectOption('createdAt:asc')
  await page.getByRole('button', { name: 'Next page', exact: true }).click()
  await page.getByRole('button', { name: 'Next page', exact: true }).click()
  await page.getByRole('link', { name: 'Z useful experiment', exact: true }).click()
  await expect(page).toHaveURL(/\/tasks\/[^/]+$/)
  const id = page.url().split('/').at(-1)!
  let fail = true
  await page.route(`**/api/tasks/${id}`, (route) =>
    route.request().method() === 'PUT' && fail
      ? route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: { message: 'Temporary test outage' } }),
        })
      : route.continue()
  )
  await page.getByLabel('Task title', { exact: true }).fill('Z useful experiment refined')
  await expect(page.getByTestId('save-status')).toContainText('Could not save')
  await expect(page.getByLabel('Task title', { exact: true })).toHaveValue(
    'Z useful experiment refined'
  )
  fail = false
  await page.getByRole('button', { name: 'Retry save', exact: true }).click()
  await expect(page.getByTestId('save-status')).toContainText('Saved')
  await page.getByLabel('Growth goal', { exact: true }).selectOption(goal.id)
  await page.getByLabel('Estimated minutes', { exact: true }).fill('25')
  await expect(page.getByTestId('save-status')).toContainText('Saved')
  await page.goto('/today')
  await page.getByLabel('Main outcome', { exact: true }).fill('Learn from one small experiment')
  await page.getByRole('button', { name: 'Choose a priority', exact: true }).click()
  await page.getByLabel('Search active tasks', { exact: true }).fill('Z useful experiment refined')
  await page
    .getByRole('button', { name: 'Choose Z useful experiment refined', exact: true })
    .click()
  await expect(page.getByTestId('save-status')).toContainText('Saved')
  await page.reload()
  await expect(page.getByLabel('Main outcome', { exact: true })).toHaveValue(
    'Learn from one small experiment'
  )
  await page.getByRole('button', { name: 'Start Focus', exact: true }).click()
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.getByRole('button', { name: 'Finish session', exact: true }).click()
  await page
    .getByLabel('Session result', { exact: true })
    .fill('The first example clarified the next step')
  await page.getByRole('button', { name: 'Made progress', exact: true }).click()
  await expect(page.getByText('Result saved', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Back to my day', exact: true }).click()
  expect((await (await page.request.get(`/api/tasks/${id}`)).json()).data.status).toBe('pending')
  await page.goto(`/goals/${goal.id}`)
  await page.getByRole('button', { name: 'Add evidence', exact: true }).click()
  await page
    .getByLabel('What did you observe?', { exact: true })
    .fill('A smaller experiment made starting easier')
  await page.getByLabel('Observed measurement', { exact: true }).fill('1')
  await page.getByRole('button', { name: 'Save evidence', exact: true }).click()
  await page.reload()
  await expect(page.getByTestId('goal-measurement')).toContainText('1 experiments')
  await page.goto('/reviews/daily')
  await page
    .getByLabel('What moved forward?', { exact: true })
    .fill('One idea became a concrete experiment')
  await page.getByRole('button', { name: 'Close this day', exact: true }).click()
  await expect(
    page.getByText('Day closed. You can return whenever you need.', { exact: true })
  ).toBeVisible()
  await page.goto('/reviews/weekly')
  await page.getByLabel('Keep', { exact: true }).fill('Make the next step small')
  await page.getByLabel('Try', { exact: true }).fill('Leave room between sessions')
  await page.getByRole('button', { name: 'Save weekly adjustment', exact: true }).click()
  await expect(
    page.getByText('Weekly adjustment saved. Leave room for life.', { exact: true })
  ).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Try', { exact: true })).toHaveValue('Leave room between sessions')
  expect(errors).toEqual([])
})
