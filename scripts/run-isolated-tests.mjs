import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { assertTestDatabase } from './test-database.mjs'

for (const file of ['.env.local', '.env']) {
  if (existsSync(file)) process.loadEnvFile(file)
}
assertTestDatabase(process.env)
const mode = process.argv[2]
if (!['integration', 'e2e'].includes(mode)) throw new Error('Choose integration or e2e')
const env = {
  ...process.env,
  DATABASE_URL: process.env.TEST_DATABASE_URL,
  NEXTAUTH_URL: 'http://127.0.0.1:3100',
  NOBRAINY_TEST_RUN: '1',
  NOBRAINY_TEST_SERVER: '1',
  NEXT_TELEMETRY_DISABLED: '1',
  PLAYWRIGHT_BROWSERS_PATH: path.resolve('evidences/platform/react-tdd-foundation/browsers'),
}
const migration = spawnSync('node_modules/.bin/prisma', ['migrate', 'deploy'], {
  env,
  stdio: 'inherit',
})
if (migration.status !== 0) process.exit(migration.status ?? 1)
const command = mode === 'e2e' ? 'playwright' : 'vitest'
const args = mode === 'e2e' ? ['test'] : ['run', '--config', 'vitest.integration.config.ts']
const result = spawnSync(`node_modules/.bin/${command}`, [...args, ...process.argv.slice(3)], {
  env,
  stdio: 'inherit',
})
process.exitCode = result.status ?? 1
