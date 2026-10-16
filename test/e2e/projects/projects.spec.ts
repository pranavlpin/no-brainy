import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

const email = `project-ui-${randomUUID()}@example.test`
const errors: string[] = []
const failedReads: { path: string; status: number }[] = []
test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus)
    await info.attach('browser-diagnostic', {
      body: JSON.stringify(
        {
          url: page.url(),
          errors,
          failedReads,
          body: await page
            .locator('body')
            .innerText({ timeout: 2000 })
            .catch(() => 'unavailable'),
        },
        null,
        2
      ),
      contentType: 'application/json',
    })
})
test.afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw new Error('Isolated runner required')
  const prisma = new PrismaClient()
  try {
    await prisma.user.deleteMany({ where: { email } })
  } finally {
    await prisma.$disconnect()
  }
})

test('a project connects its outcome, next action, schedule and preserved archive', async ({
  page,
}) => {
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => {
    if (response.status() >= 400)
      failedReads.push({ path: new URL(response.url()).pathname, status: response.status() })
  })
  await page.goto('/register')
  await page.getByLabel('Name', { exact: true }).fill('Project fixture')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('Test-only-password-918!')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page).toHaveURL(/\/today$/)
  await page.goto('/projects')
  await page.getByRole('button', { name: 'New project', exact: true }).click()
  await page.getByLabel('Project name', { exact: true }).fill('A calmer launch')
  await page
    .getByLabel('What does done look like?', { exact: true })
    .fill('A useful release with clear documentation')
  await page.getByRole('button', { name: 'Create project', exact: true }).click()
  await page.getByRole('link', { name: 'A calmer launch', exact: true }).click()
  await expect(
    page.getByText('A useful release with clear documentation', { exact: true })
  ).toBeVisible()
  await page.getByLabel('Next action', { exact: true }).fill('Write the release notes')
  await page.getByRole('button', { name: 'Add action', exact: true }).click()
  await page.getByRole('link', { name: 'Write the release notes', exact: true }).last().click()
  await expect(page).toHaveURL(/\/tasks\/[^/]+$/)
  expect(errors).toEqual([])
  await page.getByLabel('Planned day', { exact: true }).fill('2026-10-20')
  await page.getByLabel('Due Date', { exact: true }).fill('2026-10-23')
  await expect(page.getByTestId('save-status')).toContainText('Saved')
  await page.reload()
  await expect(page.getByLabel('Planned day', { exact: true })).toHaveValue('2026-10-20')
  await expect(page.getByLabel('Due Date', { exact: true })).toHaveValue('2026-10-23')
  await page.goto('/projects')
  await page.getByRole('link', { name: 'A calmer launch', exact: true }).click()
  await page.getByRole('button', { name: 'Archive project', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Archive', exact: true }).click()
  await expect(page.getByText('Archived', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Write the release notes', exact: true }).last()
  ).toBeVisible()
})
