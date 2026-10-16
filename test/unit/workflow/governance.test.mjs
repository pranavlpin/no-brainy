import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const read = (name) => readFileSync(path.join(root, name), 'utf8');

function rules() {
  assert.ok(existsSync(path.join(root, 'AGENTS.md')), 'React repository rules must exist');
  return read('AGENTS.md');
}

test('WF-01: both entry points expose the same complete repository rules', () => {
  const canonical = rules();
  assert.ok(existsSync(path.join(root, 'CLAUDE.md')), 'The second rules entry point must exist');
  assert.equal(read('CLAUDE.md'), canonical);
  assert.match(canonical, /React \/ Next\.js/);
});

test('WF-02: rules retain approval, history, TDD and React lookup contracts', () => {
  const canonical = rules();
  for (const requirement of [
    /explicitly approves that written plan/,
    /failing behavior test before the fix/,
    /Never edit, rename, move, delete or repurpose/,
    /React `key` is not a DOM locator/,
    /separate explicit request is required to launch a review/,
    /pranav@aiequmobility\.com/,
  ]) {
    assert.match(canonical, requirement);
  }
});

test('WF-02: contributor instructions point to the canonical approved workflow', () => {
  const guide = read('CONTRIBUTING.md');
  assert.ok(guide.includes(`${root}AGENTS.md`));
  assert.match(guide, /failing tests before implementation/);
  assert.match(guide, /Screenshots are captured only on explicit request/);
  assert.doesNotMatch(guide, /no new warnings|Screenshots for UI changes/);
});

test('WF-03: React rules contain no Flutter build or test commands', () => {
  assert.doesNotMatch(rules(), /dart format|flutter analyze|flutter test|pubspec\.yaml/);
});

test('WF-04: Git excludes evidence and browser artifacts, with no tracked evidence', () => {
  for (const filename of [
    'evidences/workflow/red.log',
    'playwright-report/index.html',
    'test-results/run/trace.zip',
  ]) {
    const result = spawnSync('git', ['check-ignore', '--no-index', filename], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, `${filename} must be ignored before it is written`);
  }
  const tracked = spawnSync('git', ['ls-files', 'evidences'], { cwd: root, encoding: 'utf8' });
  assert.equal(tracked.status, 0);
  assert.equal(tracked.stdout.trim(), '');
});

test('WF-05: the approved registry resolves all fourteen task and test plans', () => {
  const master = read('docs/plans/product/personal-growth-rebuild.md');
  assert.match(master, /Status: APPROVED/);
  const rows = master.split('\n').filter((line) => /^\| NB-\d{2} \|/.test(line));
  assert.equal(rows.length, 14);
  const ids = new Set();
  for (const row of rows) {
    ids.add(row.match(/NB-\d{2}/)[0]);
    const planPath = row.match(/\]\(([^)]+)\)/)[1];
    assert.ok(existsSync(planPath), `Registered plan exists: ${planPath}`);
    const plan = readFileSync(planPath, 'utf8');
    assert.match(plan, /Status: APPROVED/);
    const section = plan.match(/\/docs\/test-plans\/([a-z]+)\.md/)[1];
    assert.ok(existsSync(path.join(root, 'docs/test-plans', `${section}.md`)));
  }
  assert.equal(ids.size, 14);
});
