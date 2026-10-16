import { randomUUID } from 'node:crypto'
import { test, expect, type Page } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

const emails: string[] = []
async function register(page: Page) {
  const email = `capture-ui-${randomUUID()}@example.test`
  emails.push(email)
  await page.goto('/register')
  await page.getByLabel('Name', { exact: true }).fill('Capture fixture')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('Test-only-password-918!')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page).toHaveURL(/\/today$/)
}
test.afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw new Error('Isolated runner required')
  const prisma = new PrismaClient()
  try {
    await prisma.user.deleteMany({ where: { email: { in: emails } } })
  } finally {
    await prisma.$disconnect()
  }
})

test('capture survives closing and becomes a project action with its original source intact', async ({
  page,
}) => {
  await register(page)
  const projectResponse = await page.request.post('/api/projects', {
    data: { title: 'A useful practice', context: 'personal' },
  })
  const project = (await projectResponse.json()).data
  await page.getByTestId('capture-trigger').click()
  await page.getByLabel('Capture text').fill('Try deliberate practice https://example.com/practice')
  await page.getByRole('button', { name: 'Close Quick capture' }).click()
  await page.getByTestId('capture-trigger').click()
  await expect(page.getByLabel('Capture text')).toHaveValue(
    'Try deliberate practice https://example.com/practice'
  )
  await page.getByRole('button', { name: 'Save to Inbox' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.goto('/inbox')
  await page.getByRole('button', { name: 'Process capture', exact: true }).click()
  await page.getByLabel('Save as', { exact: true }).selectOption('task')
  await page.getByLabel('Project', { exact: true }).selectOption(project.id)
  await page.getByRole('button', { name: 'Save & next', exact: true }).click()
  await page.getByLabel('Inbox view').selectOption('processed')
  await expect(page.getByRole('link', { name: 'Original source' })).toHaveAttribute(
    'href',
    'https://example.com/practice'
  )
  await page.getByRole('link', { name: 'Open task' }).click()
  await expect(page.getByLabel('Project', { exact: true })).toHaveValue(project.id)
})

test('capture opens and closes during focus without pausing, exiting or resetting the timer', async ({
  page,
}) => {
  await register(page)
  const response = await page.request.post('/api/tasks', { data: { title: 'Stay with one thing' } })
  const task = (await response.json()).data
  await page.goto(`/tasks/${task.id}`)
  await page.getByRole('button', { name: 'Focus', exact: true }).click()
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(page.getByText('24:59', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Capture', exact: true }).click()
  await page.getByRole('button', { name: 'Inbox', exact: true }).focus()
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
  await page.getByLabel('Capture text').fill('A distraction for later')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
  await expect(page.getByText('25:00', { exact: true })).not.toBeVisible()
  await page.getByRole('button', { name: 'Capture', exact: true }).click()
  await expect(page.getByLabel('Capture text')).toHaveValue('A distraction for later')
  await page.getByRole('button', { name: 'Save to Inbox' }).click()
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
})
