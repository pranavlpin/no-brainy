import { randomUUID } from 'node:crypto'
import { beforeAll, afterAll, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { POST as preview } from '@/app/api/expenses/import/route'
import { POST as confirm } from '@/app/api/expenses/import/confirm/route'
import { POST as expense } from '@/app/api/expenses/route'
import { POST as rate } from '@/app/api/flashcards/[id]/rate/route'
import { POST as answer } from '@/app/api/quiz-sessions/[id]/answer/route'
import { POST as finish } from '@/app/api/quiz-sessions/[id]/complete/route'
import { GET as fileDownload } from '@/app/api/stash/files/[messageId]/route'
import {
  GET as readMessages,
  POST as writeMessage,
} from '@/app/api/stash/channels/[id]/messages/route'
const session = vi.hoisted(() => ({ id: '' }))
vi.mock('@/lib/auth/options', () => ({ auth: async () => ({ user: { id: session.id } }) }))
vi.mock('@/lib/gcs', () => ({ isGcsConfigured: () => false, getSignedDownloadUrl: vi.fn() }))
let foreign = ''
const req = (path: string, data: unknown) =>
  new NextRequest(`http://localhost:3100${path}`, { method: 'POST', body: JSON.stringify(data) })
beforeAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw Error('Use isolated runner')
  session.id = (
    await prisma.user.create({
      data: { email: `library-${randomUUID()}@example.test`, timezone: 'Asia/Kolkata' },
    })
  ).id
  foreign = (
    await prisma.user.create({ data: { email: `library-other-${randomUUID()}@example.test` } })
  ).id
})
afterAll(async () => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  if (process.env.NOBRAINY_TEST_RUN === '1')
    await prisma.user.deleteMany({ where: { id: { in: [session.id, foreign] } } })
  await prisma.$disconnect()
})
it('previews INR decimals without writing, then imports once and rejects foreign categories', async () => {
  const form = new FormData()
  form.append(
    'file',
    new File(['Date,Description,Amount\n2026-10-12,Useful book,1234.56\n'], 'expenses.csv', {
      type: 'text/csv',
    })
  )
  const response = await preview(
    new NextRequest('http://localhost:3100/api/expenses/import', { method: 'POST', body: form })
  )
  expect(response.status).toBe(200)
  const data = (await response.json()).data
  expect(data.rows[0].amount).toBe(1234.56)
  expect(await prisma.expense.count({ where: { userId: session.id } })).toBe(0)
  expect(
    (
      await confirm(
        req('/api/expenses/import/confirm', {
          rows: data.rows.map((row: { suggestedCategorySlug: string }) => ({
            ...row,
            categorySlug: row.suggestedCategorySlug || 'unknown',
          })),
        })
      )
    ).status
  ).toBe(201)
  const repeated = await confirm(
    req('/api/expenses/import/confirm', {
      rows: data.rows.map((row: { suggestedCategorySlug: string }) => ({
        ...row,
        categorySlug: row.suggestedCategorySlug || 'unknown',
      })),
    })
  )
  expect((await repeated.json()).data.created).toBe(0)
  expect(
    (await prisma.expense.findMany({ where: { userId: session.id } })).map((e) =>
      e.amount.toString()
    )
  ).toEqual(['1234.56'])
  const category = await prisma.expenseCategory.create({
    data: { userId: foreign, name: 'Private', slug: 'private' },
  })
  expect(
    (
      await expense(
        req('/api/expenses', {
          name: 'No access',
          amount: 10,
          date: '2026-10-12',
          categoryId: category.id,
        })
      )
    ).status
  ).toBe(404)
})
it('keeps SM-2 scheduling on the account day and quiz counts stable on repeated answers', async () => {
  vi.stubEnv('TZ', 'UTC')
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-16T19:00:00Z'))
  const deck = await prisma.deck.create({ data: { userId: session.id, name: 'Useful ideas' } })
  const card = await prisma.flashcard.create({
    data: {
      userId: session.id,
      deckId: deck.id,
      frontMd: 'Question',
      backMd: 'Answer',
      cardType: 'qa',
    },
  })
  const review = await prisma.reviewSession.create({
    data: { userId: session.id, deckId: deck.id },
  })
  const rated = await rate(
    req(`/api/flashcards/${card.id}/rate`, { rating: 'easy', sessionId: review.id })
  )
  expect(rated.status).toBe(200)
  const next = (await rated.json()).data
  expect(next.interval).toBe(1)
  expect(next.nextReviewAt.slice(0, 10)).toBe('2026-10-18')
  const quiz = await prisma.quizSession.create({
    data: { userId: session.id, deckId: deck.id, mode: 'standard', totalCards: 1 },
  })
  expect(
    (
      await answer(
        req(`/api/quiz-sessions/${quiz.id}/answer`, { cardId: card.id, answer: 'correct' })
      )
    ).status
  ).toBe(200)
  expect(
    (
      await answer(
        req(`/api/quiz-sessions/${quiz.id}/answer`, { cardId: card.id, answer: 'correct' })
      )
    ).status
  ).toBe(200)
  const result = await finish(req(`/api/quiz-sessions/${quiz.id}/complete`, {}))
  expect(result.status).toBe(200)
  expect((await result.json()).data).toMatchObject({ correctCount: 1, scorePercent: 100 })
  vi.useRealTimers()
  vi.unstubAllEnvs()
})
it('reports optional file storage as unavailable without exposing a signed URL', async () => {
  const response = await fileDownload(
    new NextRequest('http://localhost:3100/api/stash/files/missing')
  )
  expect(response.status).toBe(503)
  expect(response.headers.get('location')).toBeNull()
  expect((await response.json()).error.message).toContain('not configured')
})
it('rejects quiz answers from another owner and counts repeat submissions once', async () => {
  const deck = await prisma.deck.create({ data: { userId: session.id, name: 'A small quiz' } })
  const foreignDeck = await prisma.deck.create({ data: { userId: foreign, name: 'Private quiz' } })
  const card = await prisma.flashcard.create({
    data: {
      userId: session.id,
      deckId: deck.id,
      cardType: 'qa',
      frontMd: 'Question',
      backMd: 'Answer',
    },
  })
  const foreignCard = await prisma.flashcard.create({
    data: {
      userId: foreign,
      deckId: foreignDeck.id,
      cardType: 'qa',
      frontMd: 'Private',
      backMd: 'Private',
    },
  })
  const quiz = await prisma.quizSession.create({
    data: { userId: session.id, deckId: deck.id, mode: 'standard', totalCards: 1 },
  })
  expect(
    (
      await answer(
        req(`/api/quiz-sessions/${quiz.id}/answer`, { cardId: foreignCard.id, answer: 'correct' })
      )
    ).status
  ).toBe(400)
  for (let i = 0; i < 2; i++)
    expect(
      (
        await answer(
          req(`/api/quiz-sessions/${quiz.id}/answer`, { cardId: card.id, answer: 'correct' })
        )
      ).status
    ).toBe(200)
  const saved = await prisma.quizSession.findUniqueOrThrow({ where: { id: quiz.id } })
  expect(saved.correctCount).toBe(1)
})

it('preserves encrypted message storage and rejects another owner channel read', async () => {
  const channel = await prisma.stashChannel.create({
    data: { userId: session.id, name: 'Private space', isSensitive: true },
  })
  const path = `/api/stash/channels/${channel.id}/messages`
  const response = await writeMessage(
    req(path, { type: 'TEXT', content: 'A private test message' })
  )
  expect(response.status).toBe(201)
  const id = (await response.json()).data.id,
    stored = await prisma.stashMessage.findUniqueOrThrow({ where: { id } })
  expect(stored.isEncrypted).toBe(true)
  expect(stored.content).not.toContain('A private test message')
  const messages = await readMessages(new NextRequest(`http://localhost:3100${path}`))
  expect((await messages.json()).data.items[0].content).toBe('A private test message')
  const owner = session.id
  session.id = foreign
  try {
    expect((await readMessages(new NextRequest(`http://localhost:3100${path}`))).status).toBe(404)
  } finally {
    session.id = owner
  }
})
it('keeps distinct same-day transactions while skipping the exact imported rows on retry', async () => {
  const rows = [
    {
      date: '2026-10-13',
      name: 'Two separate coffees',
      amount: 50,
      categorySlug: 'unknown',
      originalLine: '2026-10-13,Coffee,50,REF-ONE',
    },
    {
      date: '2026-10-13',
      name: 'Two separate coffees',
      amount: 50,
      categorySlug: 'unknown',
      originalLine: '2026-10-13,Coffee,50,REF-TWO',
    },
  ]
  expect(
    (await (await confirm(req('/api/expenses/import/confirm', { rows }))).json()).data.created
  ).toBe(2)
  expect(
    (await (await confirm(req('/api/expenses/import/confirm', { rows }))).json()).data.skipped
  ).toBe(2)
})
