import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
const emails: string[] = []
test.afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw Error('Use isolated runner')
  const db = new PrismaClient()
  try {
    await db.user.deleteMany({ where: { email: { in: emails } } })
  } finally {
    await db.$disconnect()
  }
})
test('saves personal setup and previews an additive backup before confirming', async ({ page }) => {
  test.setTimeout(120000)
  const email = `backup-${randomUUID()}@example.test`
  emails.push(email)
  await page.goto('/register')
  await page.getByLabel('Name', { exact: true }).fill('Personal workspace')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('Test-only-password-918!')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page).toHaveURL(/\/today$/)
  expect((await page.request.get('/api/settings/personal')).status()).toBe(200)
  await page.goto('/settings')
  await page.getByLabel('Timezone', { exact: true }).fill('Asia/Kolkata')
  await page.getByLabel('Reduce animation', { exact: true }).check()
  await page.getByLabel('Default task context', { exact: true }).selectOption('personal')
  await page.getByLabel('Daily capacity (minutes)', { exact: true }).fill('90')
  await page.getByRole('button', { name: 'Save personal setup', exact: true }).click()
  await expect(page.getByText('Personal setup saved.', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Timezone', { exact: true })).toHaveValue('Asia/Kolkata')
  await expect(page.getByLabel('Reduce animation', { exact: true })).toBeChecked()
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced')
  await page.request.post('/api/tasks', { data: { title: 'Keep my personal progress' } })
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download core backup', exact: true }).click()
  const download = await downloaded
  const backup = await readFile((await download.path())!, 'utf8')
  expect(JSON.parse(backup).version).toBe(1)
  expect(backup).not.toContain('passwordHash')
  await page
    .getByLabel('Choose core backup', { exact: true })
    .setInputFiles({ name: 'core.json', mimeType: 'application/json', buffer: Buffer.from(backup) })
  await expect(
    page.getByRole('button', { name: 'Confirm additive import', exact: true })
  ).toBeVisible()
  expect((await (await page.request.get('/api/tasks')).json()).data.items).toHaveLength(1)
  await page.getByRole('button', { name: 'Confirm additive import', exact: true }).click()
  await expect(
    page.getByText('Core records imported. Existing records were kept.', { exact: true })
  ).toBeVisible()
  expect((await (await page.request.get('/api/tasks')).json()).data.items).toHaveLength(2)
})
