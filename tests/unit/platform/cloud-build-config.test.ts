// @vitest-environment node
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

describe('Cloud Build deploy configuration', () => {
  it('builds the app image and the migrator target and pushes both', () => {
    const yaml = read('cloudbuild.yaml')
    expect(yaml).toMatch(/nobrainy\/app:\$\{_TAG\}/)
    expect(yaml).toMatch(/--target[=\s'",]+migrator/)
    expect(yaml).toMatch(/nobrainy\/migrator:\$\{_TAG\}/)
    expect(yaml).toMatch(/\$\{_ENVIRONMENT\}-latest/)
    expect(yaml).toMatch(/^images:/m)
  })

  it('never uploads local secrets or scratch files as build context', () => {
    const ignore = read('.gcloudignore')
    expect(ignore).toMatch(/#!include:\.gitignore/)
    expect(ignore).toMatch(/^evidences\//m)
    expect(ignore).toMatch(/^\.git\b/m)
  })

  it('pins pnpm 9 in the image so the lockfile keeps installing', () => {
    const dockerfile = read('Dockerfile')
    expect(dockerfile).not.toMatch(/pnpm@latest/)
    expect(dockerfile.match(/corepack prepare pnpm@9/g)?.length).toBe(2)
  })

  it('deploys through Cloud Build when Docker is not installed', () => {
    const script = read('scripts/deploy.sh')
    expect(script).toMatch(/command -v docker/)
    expect(script).toMatch(/gcloud builds submit[\s\S]*?--config=cloudbuild\.yaml/)
  })
})
