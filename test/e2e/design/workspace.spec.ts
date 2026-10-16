import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

const email = `design-${randomUUID()}@example.test`
test.afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw new Error('Isolated runner required')
  const prisma = new PrismaClient()
  try {
    await prisma.user.deleteMany({ where: { email } })
  } finally {
    await prisma.$disconnect()
  }
})

test('legacy workspace destinations require sign-in', async ({ page }) => {
  for (const path of [
    '/today',
    '/library',
    '/notes',
    '/tasks',
    '/flashcards',
    '/stash',
    '/expenses',
    '/budgets',
    '/watchlist',
    '/bookmarks',
    '/insights',
    '/ai',
    '/notifications',
  ]) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/login\?callbackUrl=/)
  }
})

test('responsive workspace supports capture, appearance and clean navigation', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/register')
  await page.getByLabel('Name', { exact: true }).fill('Design fixture')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('Test-only-password-918!')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page).toHaveURL(/\/(notes|planner|today)$/)
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await expect(page.getByTestId('app-shell')).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true)
    await page.getByRole('button', { name: 'Capture', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Quick capture' })).toBeVisible()
    await page.keyboard.press('Escape')
  }
  await page.getByRole('button', { name: 'Switch to dark mode' }).click()
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.getByRole('button', { name: 'Switch to light mode' }).click()
  await page.reload()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('link', { name: 'Tasks', exact: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Tasks', exact: true })).toBeVisible()
  expect(
    await page
      .getByTestId('page-content')
      .evaluate((element) => getComputedStyle(element).animationDuration)
  ).toBe('0s')
  for (const destination of ['/today', '/library', '/goals', '/flashcards']) {
    const response = await page.goto(destination)
    expect(response?.status()).toBe(200)
    await expect(page.getByTestId('app-shell')).toBeVisible()
  }
  await test.info().attach('navigation-timing', {
    body: JSON.stringify(
      await page.evaluate(() =>
        performance.getEntriesByType('navigation').map((entry) => entry.toJSON())
      )
    ),
    contentType: 'application/json',
  })
  expect(errors).toEqual([])
})
