import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { assertTestDatabase } from './test-database.mjs'

const root = new URL('../', import.meta.url)
const approvedTools = [
  '@testing-library/react',
  '@testing-library/dom',
  '@testing-library/user-event',
  '@testing-library/jest-dom',
  '@playwright/test',
  'prettier',
]

function nodeIsCompatible(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)
  if (!match) return false
  const major = Number(match[1])
  const minor = Number(match[2])
  return (major === 20 && minor >= 19) || (major === 22 && minor >= 12) || major > 22
}

function validDatabase(value) {
  try {
    const url = new URL(value)
    return (
      ['postgres:', 'postgresql:'].includes(url.protocol) &&
      Boolean(url.hostname) &&
      url.pathname.length > 1 &&
      decodeURIComponent(url.password) !== 'your_password'
    )
  } catch {
    return false
  }
}

function validOrigin(value) {
  try {
    const url = new URL(value)
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname === '/'
    )
  } catch {
    return false
  }
}

/**
 * Inspect configuration and installed capabilities without connecting to external services.
 * All diagnostics exclude environment values, connection URLs and secrets.
 * A ready report means configuration is present, not that the app or database has run.
 */
export function inspectEnvironment({
  env,
  missingPackages,
  hasPnpm,
  nodeVersion,
  testMode = false,
}) {
  const checks = []
  function configured(name, valid, message) {
    checks.push({
      name,
      status: !env[name] ? 'missing' : valid ? 'configured' : 'invalid',
      message: valid ? 'Configured; value withheld.' : message,
    })
  }

  const compatible = nodeIsCompatible(nodeVersion)
  checks.push({
    name: 'node',
    status: compatible ? 'available' : 'invalid',
    message: compatible
      ? 'Node meets the test-tool minimum.'
      : 'Use Node 20.19+, 22.12+ or a newer supported release.',
  })
  checks.push({
    name: 'pnpm',
    status: hasPnpm ? 'available' : 'missing',
    message: hasPnpm
      ? 'pnpm is available.'
      : 'Make pnpm available locally to install the existing lockfile.',
  })
  checks.push({
    name: 'packages',
    status: missingPackages.length ? 'missing' : 'available',
    message: missingPackages.length
      ? `Install project dependencies and the approved developer tools (${missingPackages.length} packages unavailable).`
      : 'Declared dependencies and approved developer tools resolve locally.',
  })
  configured(
    'DATABASE_URL',
    validDatabase(env.DATABASE_URL),
    'Configure a valid PostgreSQL URL with your local database credentials.'
  )
  configured(
    'NEXTAUTH_URL',
    validOrigin(env.NEXTAUTH_URL),
    'Configure the HTTP(S) origin used to open the local app.'
  )
  const secret = env.NEXTAUTH_SECRET
  configured(
    'NEXTAUTH_SECRET',
    typeof secret === 'string' &&
      secret.length >= 32 &&
      secret !== 'generate-with-openssl-rand-base64-32',
    'Generate a private authentication secret of at least 32 characters; replace the template placeholder.'
  )
  if (testMode) {
    try {
      assertTestDatabase(env)
      checks.push({
        name: 'test-database',
        status: 'configured',
        message: 'A separate disposable local target is explicitly confirmed.',
      })
    } catch (error) {
      checks.push({ name: 'test-database', status: 'invalid', message: error.message })
    }
  }
  return {
    ready: checks.every((check) => ['available', 'configured'].includes(check.status)),
    checks,
    note: 'This check does not verify database connectivity, migrations, browser binaries, application startup or test results.',
  }
}

function installedCapabilities() {
  const manifest = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'))
  const require = createRequire(new URL('package.json', root))
  const packages = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
    ...approvedTools,
  ])
  const missingPackages = [...packages].filter((name) => {
    try {
      require.resolve(name.startsWith('@types/') ? `${name}/package.json` : name)
      return false
    } catch {
      return true
    }
  })
  const pnpm = spawnSync('pnpm', ['--version'], { encoding: 'utf8', timeout: 5000 })
  return { missingPackages, hasPnpm: pnpm.status === 0 }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let envFileError = false
  if (!process.argv.includes('--no-env-file')) {
    try {
      for (const name of ['.env.local', '.env']) {
        const location = new URL(name, root)
        if (existsSync(location)) process.loadEnvFile(location)
      }
    } catch {
      envFileError = true
    }
  }
  const report = inspectEnvironment({
    env: process.env,
    nodeVersion: process.versions.node,
    ...installedCapabilities(),
    testMode: process.argv.includes('--test'),
  })
  if (envFileError) {
    report.ready = false
    report.checks.push({
      name: 'environment-file',
      status: 'invalid',
      message: 'The local environment file could not be loaded; inspect it privately.',
    })
  }
  process.stdout.write(
    process.argv.includes('--json')
      ? `${JSON.stringify(report, null, 2)}\n`
      : `${report.checks.map((check) => `${check.status.toUpperCase()} ${check.name}: ${check.message}`).join('\n')}\n${report.note}\n`
  )
  process.exitCode = report.ready ? 0 : 1
}
