import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'

const script = new URL('../../../scripts/check-format.mjs', import.meta.url)

test('format selection protects historical records, generated files and private evidence', async () => {
  assert.ok(existsSync(script), 'The formatter boundary must exist')
  const { formatTargets } = await import(script.href)
  assert.deepEqual(
    formatTargets([
      'src/components/ui/button.tsx',
      'README.md',
      'scripts/check-format.mjs',
      'test/unit/platform/check-format.test.mjs',
      'docs/plans/product/old.md',
      'docs/tasks/product.md',
      'docs/test-plans/product.md',
      'pnpm-lock.yaml',
      '.env',
      '.env.local',
      'evidences/export.json',
      '.next/manifest.json',
      'node_modules/example/index.js',
      'next-env.d.ts',
    ]),
    [
      'README.md',
      'scripts/check-format.mjs',
      'src/components/ui/button.tsx',
      'test/unit/platform/check-format.test.mjs',
    ]
  )
})
