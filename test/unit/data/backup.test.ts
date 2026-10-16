import { it, expect } from 'vitest'
import { coreSchemas, parseBackup } from '@/lib/validations/backup'
import { personalSettings, personalSettingsSchema } from '@/lib/data/settings'
const empty = () => ({
  version: 1,
  scope: 'nobrainy-core',
  exportedAt: '2026-10-16T00:00:00.000Z',
  omittedLinks: 0,
  data: Object.fromEntries(Object.keys(coreSchemas).map((key) => [key, []])),
})
it('accepts empty core workspaces and rejects foreign schemas and secret fields', () => {
  expect(parseBackup(empty()).data.tasks).toEqual([])
  expect(() => parseBackup({ ...empty(), version: 2 })).toThrow()
  expect(() => parseBackup({ ...empty(), passwordHash: 'not-portable' })).toThrow()
  expect(() => parseBackup({ ...empty(), scope: 'full-database' })).toThrow()
})
it('exports no credential or public-access fields in any allowlist', () => {
  const forbidden = [
    'passwordHash',
    'preferences',
    'email',
    'userId',
    'shareId',
    'isPublic',
    'activeOwner',
    'refreshToken',
    'apiKey',
    'clientRequestId',
  ]
  for (const schema of Object.values(coreSchemas))
    for (const key of forbidden) expect(Object.keys(schema.shape)).not.toContain(key)
})
it('validates timezone, capacity and paired working windows while reading only safe preferences', () => {
  expect(personalSettingsSchema.safeParse({ timezone: 'Not/A_Timezone' }).success).toBe(false)
  expect(personalSettingsSchema.safeParse({ timezone: 'UTC', availableMinutes: -1 }).success).toBe(
    false
  )
  expect(
    personalSettingsSchema.safeParse({ timezone: 'UTC', workStart: '18:00', workEnd: '09:00' })
      .success
  ).toBe(false)
  expect(
    personalSettingsSchema.safeParse({ timezone: 'Asia/Kolkata', workStart: null, workEnd: null })
      .success
  ).toBe(true)
  expect(
    personalSettings('Asia/Kolkata', { apiKey: 'private', personal: { reduceMotion: true } })
  ).toMatchObject({
    timezone: 'Asia/Kolkata',
    reduceMotion: true,
    availableMinutes: 180,
    sound: false,
  })
  expect(JSON.stringify(personalSettings('UTC', { apiKey: 'private' }))).not.toContain('private')
})
