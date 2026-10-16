import { randomUUID } from 'node:crypto'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import { it, expect } from 'vitest'

it('upgrades a populated legacy workspace without losing module records or relationships', async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw Error('Use the isolated test runner')
  const url = new URL(process.env.DATABASE_URL!)
  if (!url.pathname.endsWith('_test') || !['localhost', '127.0.0.1'].includes(url.hostname))
    throw Error('Disposable local database required')
  const schema = `nb_upgrade_${randomUUID().replaceAll('-', '')}`
  const admin = new PrismaClient()
  url.searchParams.set('schema', schema)
  const db = new PrismaClient({ datasources: { db: { url: url.toString() } } })
  const migrations = readdirSync(resolve('prisma/migrations'))
    .filter((name) => /^\d/.test(name))
    .sort()
  const apply = (name: string) => {
    const result = spawnSync(
      '/opt/homebrew/opt/postgresql@16/bin/psql',
      [
        '--no-psqlrc',
        '--set',
        'ON_ERROR_STOP=1',
        '--file',
        resolve('prisma/migrations', name, 'migration.sql'),
      ],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          PGHOST: url.hostname,
          PGPORT: url.port,
          PGUSER: decodeURIComponent(url.username),
          PGPASSWORD: decodeURIComponent(url.password),
          PGDATABASE: url.pathname.slice(1),
          PGOPTIONS: `-c search_path=${schema}`,
          PGSSLMODE: 'disable',
        },
        timeout: 15000,
      }
    )
    if (result.status !== 0) throw Error(`Migration ${name} failed: ${result.stderr}`)
  }
  try {
    await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`)
    migrations.filter((name) => name < '20261016').forEach(apply)
    const seed = [
      `INSERT INTO users (id,email,timezone,preferences) VALUES ('owner','migration@example.test','Asia/Kolkata','{"keep":"original"}')`,
      `INSERT INTO notes (id,"userId",title,"contentMd","updatedAt") VALUES ('note','owner','Original note','**Keep** [[Other note]]',NOW()),('note2','owner','Other note','Original linked content',NOW())`,
      `INSERT INTO note_links (id,"sourceId","targetType","targetId") VALUES ('link','note','note','note2')`,
      `INSERT INTO expense_categories (id,"userId",name,slug,"updatedAt") VALUES ('category','owner','Learning','learning',NOW())`,
      `INSERT INTO goals (id,"userId",title,"expenseCategoryId","targetAmount","updatedAt") VALUES ('goal','owner','Original goal','category',5000.50,NOW())`,
      `INSERT INTO tasks (id,"userId",title,"goalId","dueDate","updatedAt") VALUES ('task','owner','Original task','goal','2026-10-20',NOW())`,
      `INSERT INTO tasks (id,"userId",title,"parentTaskId","updatedAt") VALUES ('child','owner','Original subtask','task',NOW())`,
      `INSERT INTO task_links ("taskId","linkedType","linkedId") VALUES ('task','note','note')`,
      `INSERT INTO books (id,"userId",title,"summaryMd","applicationMd","pagesRead","updatedAt") VALUES ('book','owner','Original book','Summary kept','Try this',12,NOW())`,
      `INSERT INTO decks (id,"userId",name,"updatedAt") VALUES ('deck','owner','Original deck',NOW())`,
      `INSERT INTO flashcards (id,"userId","deckId","cardType","frontMd","backMd","interval","nextReviewAt","updatedAt") VALUES ('card','owner','deck','qa','Question','Answer',7,'2026-10-20',NOW())`,
      `INSERT INTO day_plans (id,"userId","planDate","focusTaskIds","timeBlocks") VALUES ('plan','owner','2026-10-16',ARRAY['task'],'[{"id":"block","title":"Original block","startTime":"09:00","endTime":"09:30","taskId":"task","isCompleted":false}]')`,
      `INSERT INTO daily_reviews (id,"userId","reviewDate","reflectionMd","tasksCompleted","tasksMissed") VALUES ('review','owner','2026-10-16','Original reflection',3,2)`,
      `INSERT INTO expenses (id,"userId","categoryId",name,amount,date,"updatedAt") VALUES ('expense','owner','category','Original purchase',1234.56,'2026-10-16',NOW())`,
      `INSERT INTO budgets (id,"userId","categoryId",name,amount,"updatedAt") VALUES ('budget','owner','category','Original budget',2000.75,NOW())`,
      `INSERT INTO bookmarks (id,"userId",title,url,"updatedAt") VALUES ('bookmark','owner','Original bookmark','https://example.test/reference',NOW())`,
      `INSERT INTO watchlist_items (id,"userId",title,"updatedAt") VALUES ('watch','owner','Original film',NOW())`,
      `INSERT INTO stash_channels (id,"userId",name,"isSensitive","updatedAt") VALUES ('channel','owner','Private channel',true,NOW())`,
      `INSERT INTO stash_messages (id,"userId","channelId",content,"isEncrypted","updatedAt") VALUES ('message','owner','channel','original-encrypted-payload',true,NOW())`,
    ]
    for (const sql of seed) await db.$executeRawUnsafe(sql)
    migrations.filter((name) => name >= '20261016').forEach(apply)
    expect((await db.user.findUniqueOrThrow({ where: { id: 'owner' } })).preferences).toEqual({
      keep: 'original',
    })
    const task = await db.task.findUniqueOrThrow({
      where: { id: 'task' },
      include: { subtasks: true, taskLinks: true, goal: true },
    })
    expect(task.title).toBe('Original task')
    expect(task.subtasks[0].id).toBe('child')
    expect(task.taskLinks[0].linkedId).toBe('note')
    expect(task.goal?.targetAmount?.toString()).toBe('5000.5')
    expect(task.goal?.expenseCategoryId).toBe('category')
    expect(task.plannedDate).toBeNull()
    expect(task.dueDate?.toISOString().slice(0, 10)).toBe('2026-10-20')
    expect((await db.note.findUniqueOrThrow({ where: { id: 'note' } })).contentMd).toBe(
      '**Keep** [[Other note]]'
    )
    expect((await db.noteLink.findUniqueOrThrow({ where: { id: 'link' } })).targetId).toBe('note2')
    expect((await db.book.findUniqueOrThrow({ where: { id: 'book' } })).applicationMd).toBe(
      'Try this'
    )
    expect((await db.flashcard.findUniqueOrThrow({ where: { id: 'card' } })).interval).toBe(7)
    expect((await db.deck.findUniqueOrThrow({ where: { id: 'deck' } })).name).toBe('Original deck')
    const plan = await db.dayPlan.findUniqueOrThrow({ where: { id: 'plan' } })
    expect(plan.focusTaskIds).toEqual(['task'])
    expect(plan.availableMinutes).toBe(180)
    expect(plan.timeBlocks).toEqual(
      expect.arrayContaining([expect.objectContaining({ taskId: 'task' })])
    )
    expect(await db.dailyReview.findUniqueOrThrow({ where: { id: 'review' } })).toMatchObject({
      reflectionMd: 'Original reflection',
      tasksCompleted: 3,
      tasksMissed: 2,
      whatMoved: '',
    })
    expect(
      (await db.expense.findUniqueOrThrow({ where: { id: 'expense' } })).amount.toString()
    ).toBe('1234.56')
    expect((await db.budget.findUniqueOrThrow({ where: { id: 'budget' } })).amount.toString()).toBe(
      '2000.75'
    )
    expect((await db.bookmark.findUniqueOrThrow({ where: { id: 'bookmark' } })).url).toBe(
      'https://example.test/reference'
    )
    expect((await db.watchlistItem.findUniqueOrThrow({ where: { id: 'watch' } })).title).toBe(
      'Original film'
    )
    expect(await db.stashMessage.findUniqueOrThrow({ where: { id: 'message' } })).toMatchObject({
      content: 'original-encrypted-payload',
      isEncrypted: true,
      channelId: 'channel',
    })
    expect(await db.coreImportReceipt.count()).toBe(0)
  } finally {
    await db.$disconnect()
    await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
    await admin.$disconnect()
  }
}, 60000)
