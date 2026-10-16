import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

/** Select changed source/current docs without rewriting immutable ledgers or private artifacts. */
export function formatTargets(files) {
  return [...new Set(files)]
    .filter((file) => {
      if (
        /^(docs\/(plans|tasks|test-plans)\/|evidences\/|node_modules\/|\.next\/|\.env)/.test(file)
      )
        return false
      if (['pnpm-lock.yaml', 'next-env.d.ts'].includes(file)) return false
      return /\.(mjs|cjs|js|jsx|ts|tsx|json|css|md|yml|yaml)$/.test(file)
    })
    .sort()
}

function gitFiles(args) {
  const result = spawnSync('git', args, { encoding: 'utf8' })
  if (result.status !== 0) throw new Error('Unable to determine changed files for formatting')
  return result.stdout.split('\0').filter(Boolean)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = formatTargets([
    ...gitFiles([
      'diff',
      '--name-only',
      '--diff-filter=ACMR',
      '-z',
      process.env.FORMAT_BASE || 'main',
    ]),
    ...gitFiles(['ls-files', '--others', '--exclude-standard', '-z']),
  ]).filter((file) => existsSync(file))
  if (!files.length) process.stdout.write('No changed source files require formatting.\n')
  else {
    const mode = process.argv.includes('--write') ? '--write' : '--check'
    const result = spawnSync('node_modules/.bin/prettier', [mode, '--', ...files], {
      stdio: 'inherit',
    })
    process.exitCode = result.status ?? 1
  }
}
