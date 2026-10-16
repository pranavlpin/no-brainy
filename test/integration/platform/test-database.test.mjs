import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const script = new URL('../../../scripts/test-database.mjs', import.meta.url)
const fixture = {
  DATABASE_URL: 'postgresql://developer:development-password@localhost:5432/nobrainy',
  TEST_DATABASE_URL: 'postgresql://tester:test-password@localhost:5432/nobrainy_test',
  TEST_DATABASE_CONFIRM: 'nobrainy_test',
}

async function guard() {
  assert.ok(existsSync(script), 'A guard must exist before a test database can be used')
  return (await import(script.href)).assertTestDatabase
}

test('NB-02-T03: only an explicitly confirmed local disposable database is accepted', async () => {
  const validate = await guard()
  assert.deepEqual(validate(fixture), {
    hostname: 'localhost',
    port: '5432',
    database: 'nobrainy_test',
  })
})

test('NB-02-T03: missing and mismatched confirmations fail closed', async () => {
  const validate = await guard()
  for (const confirmation of ['', undefined, 'nobrainy_test_other']) {
    assert.throws(() => validate({ ...fixture, TEST_DATABASE_CONFIRM: confirmation }), /confirm/i)
  }
})

test('NB-02-T03: production, remote, ambiguous and invalid targets are rejected', async () => {
  const validate = await guard()
  for (const url of [
    'postgresql://tester:private@localhost:5432/nobrainy',
    'postgresql://tester:private@localhost:5432/nobrainy_production_test',
    'postgresql://tester:private@db.example.com:5432/nobrainy_test',
    'postgresql://tester:private@localhost.example.com:5432/nobrainy_test',
    'postgresql://tester:private@localhost:5432/nobrainy_test?host=db.example.com',
    'postgresql://tester:private@localhost:5432/nobrainy_test?schema=production',
    'postgresql://tester:private@localhost:5432/nobrainy_test#production',
    'https://localhost/nobrainy_test',
    'not-a-url-private',
    '',
  ]) {
    assert.throws(
      () => validate({ ...fixture, TEST_DATABASE_URL: url }),
      (error) => {
        assert.ok(!error.message.includes('private'))
        assert.ok(!error.message.includes(url) || url === '')
        return true
      }
    )
  }
})

test('NB-02-T03: the development database cannot also be the test database', async () => {
  const validate = await guard()
  for (const host of ['localhost', '127.0.0.1', '[::1]']) {
    assert.throws(
      () =>
        validate({
          ...fixture,
          DATABASE_URL: `postgresql://different-user:private@${host}/nobrainy_test`,
        }),
      /development database/i
    )
  }
})

test('NB-02-T03: an unknown development target cannot be assumed separate', async () => {
  const validate = await guard()
  for (const developmentUrl of ['', undefined, 'private-invalid-url']) {
    assert.throws(() => validate({ ...fixture, DATABASE_URL: developmentUrl }), /DATABASE_URL/)
  }
})

test('NB-02-T03: development connection overrides cannot hide a shared test target', async () => {
  const validate = await guard()
  for (const url of [
    'postgresql://developer:private@db.example.com/nobrainy_test?host=localhost',
    'postgresql://developer:private@localhost:6432/nobrainy_test?port=5432',
    'postgresql://developer:private@localhost/other?dbname=nobrainy_test',
  ]) {
    assert.throws(() => validate({ ...fixture, DATABASE_URL: url }), /override/i)
  }
})

test('NB-02-T03: the CLI rejects unsafe targets without printing connection credentials', () => {
  assert.ok(existsSync(script), 'The database guard CLI must exist')
  const result = spawnSync(process.execPath, [fileURLToPath(script)], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH, ...fixture, TEST_DATABASE_CONFIRM: '' },
  })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /confirm/i)
  assert.ok(!result.stderr.includes('test-password'))
  assert.ok(!result.stderr.includes('development-password'))
  assert.equal(result.stdout, '')
})
