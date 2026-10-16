import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
const email = `responsive-final-${randomUUID()}@example.test`
test.afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw Error('Isolated runner required')
  const db = new PrismaClient()
  try {
    await db.user.deleteMany({ where: { email } })
  } finally {
    await db.$disconnect()
  }
})
test('primary routes stay usable at phone, tablet and desktop sizes with keyboard and reduced motion', async ({
  page,
}) => {
  test.setTimeout(180000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/register')
  await page.getByLabel('Name', { exact: true }).fill('Responsive acceptance')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('Test-only-password-918!')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page).toHaveURL(/\/today$/)
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of [
      '/today',
      '/tasks',
      '/projects',
      '/growth',
      '/reviews',
      '/library',
      '/settings',
    ]) {
      await page.goto(path)
      await expect(page.getByRole('main')).toBeVisible()
      await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      )
      expect(
        await page
          .getByTestId('page-content')
          .evaluate((element) => parseFloat(getComputedStyle(element).animationDuration))
      ).toBeLessThanOrEqual(0.001)
    }
    await page.getByTestId('capture-trigger').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.getByRole('button', { name: 'Switch to light mode', exact: true }).click()
    await expect(page.locator('html')).toHaveClass(/light/)
  }
})
