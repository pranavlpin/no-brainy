import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
const email = `learning-ui-${randomUUID()}@example.test`
test.afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw Error('Use isolated runner')
  const db = new PrismaClient()
  try {
    await db.user.deleteMany({ where: { email } })
  } finally {
    await db.$disconnect()
  }
})
test('a book application becomes a scheduled action with the real learning source and no AI key', async ({
  page,
}) => {
  await page.goto('/register')
  await page.getByLabel('Name', { exact: true }).fill('Learning fixture')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('Test-only-password-918!')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page).toHaveURL(/\/today$/)
  const response = await page.request.post('/api/books', {
    data: { title: 'Practise clear explanations' },
  })
  expect(response.status()).toBe(201)
  const book = (await response.json()).data
  expect(
    (
      await page.request.patch(`/api/books/${book.id}`, {
        data: { applicationMd: 'Write one example from memory' },
      })
    ).ok()
  ).toBe(true)
  await page.goto(`/books/${book.id}`)
  await page.getByRole('button', { name: "How I'll Apply This", exact: true }).click()
  await page.getByRole('button', { name: 'Turn into an experiment', exact: true }).click()
  await expect(page.getByLabel('How will you try it? (optional)', { exact: true })).toHaveValue(
    'Write one example from memory'
  )
  await page.getByLabel('Next action title', { exact: true }).fill('Try a clearer example')
  await page.getByRole('button', { name: 'Plan for Today', exact: true }).click()
  await page.getByRole('button', { name: 'Create action', exact: true }).click()
  await page.getByRole('link', { name: 'Open your experiment', exact: true }).click()
  await expect(page.getByLabel('Task title', { exact: true })).toHaveValue('Try a clearer example')
  const task = (await (await page.request.get('/api/tasks/' + page.url().split('/').at(-1))).json())
    .data
  expect(task.plannedDate).not.toBeNull()
  expect(task.dueDate).toBeNull()
  expect(task.descriptionMd).toContain('Write one example from memory')
  expect(task.taskLinks).toEqual(
    expect.arrayContaining([expect.objectContaining({ linkedType: 'book', linkedId: book.id })])
  )
})
