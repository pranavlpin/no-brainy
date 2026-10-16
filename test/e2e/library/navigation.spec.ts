import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
const email = `library-ui-${randomUUID()}@example.test`
test.afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw Error('Use isolated runner')
  const db = new PrismaClient()
  try {
    await db.user.deleteMany({ where: { email } })
  } finally {
    await db.$disconnect()
  }
})
test('reaches Library and Life on a narrow screen and creates a learning deck through labeled controls', async ({
  page,
}) => {
  test.setTimeout(120000)
  await page.goto('/register')
  await page.getByLabel('Name', { exact: true }).fill('Library fixture')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('Test-only-password-918!')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page).toHaveURL(/\/today$/)
  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 900 })
    for (const [title, path] of [
      ['Notes', 'notes'],
      ['Books', 'books'],
      ['Flashcards', 'flashcards'],
      ['Bookmarks', 'bookmarks'],
      ['Watchlist', 'watchlist'],
      ['Stash', 'stash'],
      ['Expenses', 'expenses'],
      ['Budgets', 'budgets'],
    ]) {
      await page.goto('/library')
      await page
        .locator('main')
        .getByRole('link', { name: new RegExp(`^${title}`) })
        .click()
      await expect(page).toHaveURL(new RegExp(`/${path}$`))
      await expect(page.locator('main')).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `${title} at ${width}px`
      ).toBe(true)
    }
  }
  await page.goto('/flashcards')
  await page.getByRole('button', { name: 'New Deck', exact: true }).click()
  await page.getByLabel('Name', { exact: true }).fill('A little daily practice', { timeout: 5000 })
  await page.getByRole('button', { name: 'Create', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'A little daily practice', exact: true })
  ).toBeVisible()
})
