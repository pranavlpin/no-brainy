import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import test from 'node:test'

const root = fileURLToPath(new URL('../../../', import.meta.url))

test('NB-02-T02: Vitest discovers every relocated legacy test in its module', () => {
  const result = spawnSync(path.join(root, 'node_modules/.bin/vitest'), ['list', '--json'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 30000,
  })
  assert.equal(result.status, 0, result.stderr)
  const discovered = JSON.parse(result.stdout)
  for (const [file, expected] of [
    ['test/unit/platform/setup.test.ts', 2],
    ['test/unit/stash/url.test.ts', 9],
    ['test/unit/stash/encrypt-message.test.ts', 7],
  ]) {
    assert.equal(
      discovered.filter((entry) => entry.file === path.join(root, file)).length,
      expected,
      file
    )
  }
})

test('NB-02-T02: the primary test command includes Node governance and Vitest', () => {
  const { scripts } = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
  assert.match(scripts.test, /test:node/)
  assert.match(scripts.test, /vitest run/)
  assert.match(scripts['test:node'], /run-node-tests/)
})
