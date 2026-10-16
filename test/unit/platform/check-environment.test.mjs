import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const script = new URL('../../../scripts/check-environment.mjs', import.meta.url)
const fixture = {
  env: {
    DATABASE_URL: 'postgresql://developer:private-password@localhost:5432/nobrainy',
    NEXTAUTH_URL: 'http://localhost:3000',
    NEXTAUTH_SECRET: 'private-auth-secret-with-at-least-thirty-two-characters',
  },
  missingPackages: [],
  hasPnpm: true,
  nodeVersion: '22.20.0',
}

async function inspect(options) {
  assert.ok(existsSync(script), 'The environment verifier must be implemented')
  const { inspectEnvironment } = await import(script.href)
  return inspectEnvironment(options)
}

test('NB-02-T01: missing configuration and tools are actionable checks', async () => {
  const report = await inspect({
    env: {},
    missingPackages: ['next', 'vitest'],
    hasPnpm: false,
    nodeVersion: '22.20.0',
  })
  assert.equal(report.ready, false)
  for (const name of ['DATABASE_URL', 'NEXTAUTH_URL', 'NEXTAUTH_SECRET', 'packages', 'pnpm']) {
    const check = report.checks.find((item) => item.name === name)
    assert.equal(check?.status, 'missing', name)
    assert.ok(check.message.length > 10, `${name} needs a useful next step`)
  }
})

test('NB-02-T01: valid setup reports configured, without claiming a database connection', async () => {
  const report = await inspect(fixture)
  assert.equal(report.ready, true)
  assert.equal(report.checks.find((item) => item.name === 'DATABASE_URL').status, 'configured')
  assert.match(report.note, /does not verify.*database/i)
  const output = JSON.stringify(report)
  for (const secret of Object.values(fixture.env)) assert.ok(!output.includes(secret))
})

test('NB-02-T01: malformed inputs do not appear in diagnostics', async () => {
  const secret = 'do-not-print-this-private-value'
  const report = await inspect({
    ...fixture,
    env: { DATABASE_URL: secret, NEXTAUTH_URL: secret, NEXTAUTH_SECRET: secret },
  })
  assert.equal(report.ready, false)
  assert.ok(!JSON.stringify(report).includes(secret))
})

test('NB-02-T01: copied placeholders and invalid protocols are not ready', async () => {
  for (const env of [
    { ...fixture.env, NEXTAUTH_SECRET: 'generate-with-openssl-rand-base64-32' },
    { ...fixture.env, DATABASE_URL: 'postgresql://postgres:your_password@localhost:5432/nobrainy' },
    { ...fixture.env, DATABASE_URL: 'https://localhost/database' },
    { ...fixture.env, NEXTAUTH_URL: 'javascript:alert(1)' },
  ]) {
    assert.equal((await inspect({ ...fixture, env })).ready, false)
  }
})

test('NB-02-T01: unsupported Node versions are diagnosed before running test tools', async () => {
  for (const nodeVersion of ['18.20.8', '20.18.0', '22.11.0', 'invalid']) {
    const report = await inspect({ ...fixture, nodeVersion })
    assert.equal(report.ready, false)
    assert.equal(report.checks.find((item) => item.name === 'node').status, 'invalid')
  }
})

test('NB-02-T01: test readiness requires a separate confirmed database', async () => {
  assert.equal((await inspect({ ...fixture, testMode: true })).ready, false)
  const testEnv = {
    ...fixture.env,
    TEST_DATABASE_URL: 'postgresql://tester:private@localhost:5432/nobrainy_test',
    TEST_DATABASE_CONFIRM: 'nobrainy_test',
  }
  assert.equal((await inspect({ ...fixture, env: testEnv, testMode: true })).ready, true)
  const shared = { ...testEnv, DATABASE_URL: testEnv.TEST_DATABASE_URL }
  const report = await inspect({ ...fixture, env: shared, testMode: true })
  assert.equal(report.ready, false)
  assert.ok(!JSON.stringify(report).includes('private'))
})

test('NB-02-T01: the CLI emits a redacted report and exits nonzero when setup is missing', () => {
  assert.ok(existsSync(script), 'The environment verifier CLI must exist')
  const result = spawnSync(process.execPath, [fileURLToPath(script), '--json', '--no-env-file'], {
    cwd: fileURLToPath(new URL('../../../', import.meta.url)),
    encoding: 'utf8',
    env: { PATH: process.env.PATH, DATABASE_URL: 'secret-invalid-database-value' },
  })
  assert.equal(result.status, 1)
  const report = JSON.parse(result.stdout)
  assert.equal(report.ready, false)
  assert.ok(!result.stdout.includes('secret-invalid-database-value'))
  assert.equal(result.stderr, '')
})
