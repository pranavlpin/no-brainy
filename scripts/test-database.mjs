import { pathToFileURL } from 'node:url'

const localHosts = new Set(['localhost', '127.0.0.1', '[::1]'])

function parseDatabase(value, name) {
  try {
    const url = new URL(value)
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname) {
      throw new Error()
    }
    const database = decodeURIComponent(url.pathname.slice(1))
    if (!database || database.includes('/')) throw new Error()
    return { url, database }
  } catch {
    throw new Error(`${name} must be a valid PostgreSQL connection URL.`)
  }
}

/**
 * Validate an explicitly disposable local test database before any migration or cleanup.
 * Returns only a redacted target identity. Throws a credential-free error on unsafe input.
 * This function never connects to, creates, resets or deletes a database.
 */
export function assertTestDatabase(env) {
  const development = parseDatabase(env.DATABASE_URL, 'DATABASE_URL')
  const target = parseDatabase(env.TEST_DATABASE_URL, 'TEST_DATABASE_URL')
  if (
    development.url.hash ||
    [...development.url.searchParams.keys()].some((key) => !['schema', 'sslmode'].includes(key))
  ) {
    throw new Error(
      'Development connection overrides prevent proving that the test target is separate.'
    )
  }
  if (!localHosts.has(target.url.hostname) || target.url.search || target.url.hash) {
    throw new Error('TEST_DATABASE_URL must target loopback without query parameters or fragments.')
  }
  if (!/^nobrainy_test(?:_[a-z0-9]+)*$/.test(target.database)) {
    throw new Error('The disposable database name must be nobrainy_test or nobrainy_test_<suffix>.')
  }
  if (env.TEST_DATABASE_CONFIRM !== target.database) {
    throw new Error(
      'Set TEST_DATABASE_CONFIRM to the exact disposable database name to confirm it.'
    )
  }

  const developmentHost = localHosts.has(development.url.hostname)
    ? 'loopback'
    : development.url.hostname
  if (
    developmentHost === 'loopback' &&
    (development.url.port || '5432') === (target.url.port || '5432') &&
    development.database === target.database
  ) {
    throw new Error('The test database must be separate from the development database.')
  }

  return {
    hostname: target.url.hostname,
    port: target.url.port || '5432',
    database: target.database,
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const target = assertTestDatabase(process.env)
    process.stdout.write(
      `Disposable target confirmed: ${target.hostname}:${target.port}/${target.database}\n`
    )
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  }
}
