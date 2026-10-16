import { readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

function collect(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name)
    return entry.isDirectory()
      ? collect(filename)
      : filename.endsWith('.test.mjs')
        ? [filename]
        : []
  })
}

const files = [...collect('test/unit'), ...collect('test/integration')].sort()
if (!files.length) throw new Error('No Node bootstrap tests discovered')
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' })
process.exitCode = result.status ?? 1
