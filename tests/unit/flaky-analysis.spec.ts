import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { expect, test, type TestInfo } from '@playwright/test';
import { findFlaky, loadResults } from '@src/reporting/flaky-analysis';

type Case = { name: string; classname?: string; failure?: string | null; error?: string; skipped?: boolean };

function junit(cases: Case[]): string {
  const body = cases
    .map((c) => {
      const attrs = `classname="${c.classname ?? 'suite'}" name="${c.name}" time="0.1"`;
      if (c.skipped) return `<testcase ${attrs}><skipped/></testcase>`;
      if (c.failure !== undefined) {
        const msg = c.failure === null ? '' : ` message="${c.failure}"`;
        return `<testcase ${attrs}><failure${msg}>stack</failure></testcase>`;
      }
      if (c.error) return `<testcase ${attrs}><error message="${c.error}"/></testcase>`;
      return `<testcase ${attrs}/>`;
    })
    .join('');
  return `<?xml version="1.0"?><testsuites><testsuite name="s" tests="${cases.length}">${body}</testsuite></testsuites>`;
}

function writeRuns(testInfo: TestInfo, runs: Record<string, Case[]>): string {
  const dir = testInfo.outputPath('junit');
  for (const [file, cases] of Object.entries(runs)) {
    const path = join(dir, file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, junit(cases));
  }
  return dir;
}

test('flags a test that both passed and failed', ({}, testInfo) => {
  const dir = writeRuns(testInfo, {
    'run1.xml': [{ name: 'stable' }, { name: 'shaky' }],
    'run2.xml': [{ name: 'stable' }, { name: 'shaky', failure: 'timeout' }],
    'run3.xml': [{ name: 'stable' }, { name: 'shaky' }],
  });
  expect(findFlaky(loadResults(dir), 3)).toEqual([
    { testId: 'suite::shaky', failRate: 100 / 3, runs: 3, firstFailure: 'timeout' },
  ]);
});

test('does not flag tests that always pass or always fail', ({}, testInfo) => {
  const runs = Object.fromEntries(
    [1, 2, 3].map((i) => [`run${i}.xml`, [{ name: 'green' }, { name: 'red', failure: 'boom' }]]),
  );
  expect(findFlaky(loadResults(writeRuns(testInfo, runs)), 3)).toEqual([]);
});

test('counts <error> as a failure and ignores skipped runs', ({}, testInfo) => {
  const dir = writeRuns(testInfo, {
    'a.xml': [{ name: 't' }],
    'b.xml': [{ name: 't', error: 'crashed' }],
    'c.xml': [{ name: 't', skipped: true }],
    'd.xml': [{ name: 't' }],
  });
  const results = loadResults(dir);
  expect(results.get('suite::t')).toHaveLength(3);
  expect(findFlaky(results, 3)[0]).toMatchObject({ runs: 3, firstFailure: 'crashed' });
});

test('respects min-runs', ({}, testInfo) => {
  const dir = writeRuns(testInfo, { 'a.xml': [{ name: 't' }], 'b.xml': [{ name: 't', failure: 'x' }] });
  expect(findFlaky(loadResults(dir), 3)).toEqual([]);
  expect(findFlaky(loadResults(dir), 2)).toHaveLength(1);
});

test('uses the first non-empty failure message, or a placeholder', ({}, testInfo) => {
  const dir = writeRuns(testInfo, {
    'a.xml': [{ name: 'x', failure: null }, { name: 'y', failure: null }],
    'b.xml': [{ name: 'x', failure: 'second' }, { name: 'y' }],
    'c.xml': [{ name: 'x' }, { name: 'y' }],
  });
  const byId = Object.fromEntries(findFlaky(loadResults(dir), 3).map((f) => [f.testId, f.firstFailure]));
  expect(byId).toEqual({ 'suite::x': 'second', 'suite::y': '(no message)' });
});

test('reads nested directories, keys by classname, and sorts by fail rate', ({}, testInfo) => {
  const dir = writeRuns(testInfo, {
    'ci/1/junit.xml': [{ classname: 'A', name: 't' }, { classname: 'B', name: 't', failure: 'b' }],
    'ci/2/junit.xml': [{ classname: 'A', name: 't', failure: 'a' }, { classname: 'B', name: 't', failure: 'b' }],
    'ci/3/junit.xml': [{ classname: 'A', name: 't' }, { classname: 'B', name: 't' }],
    'notes.txt': [],
  });
  expect(findFlaky(loadResults(dir), 3).map((f) => f.testId)).toEqual(['B::t', 'A::t']);
});

test.describe('CLI', () => {
  const cli = (args: string[]) =>
    execFileSync(join('node_modules', '.bin', 'tsx'), ['scripts/analyze-flaky-tests.ts', ...args], { encoding: 'utf-8' });

  test('prints a readable report and JSON', ({}, testInfo) => {
    const dir = writeRuns(testInfo, {
      'a.xml': [{ name: 't' }],
      'b.xml': [{ name: 't', failure: 'flaked' }],
    });
    expect(cli([dir, '--min-runs', '2'])).toContain('- suite::t  fail 50% over 2 runs  | flaked');
    expect(JSON.parse(cli([dir, '--min-runs', '2', '--json']))).toHaveLength(1);
    expect(cli([dir])).toContain('No flaky tests found.');
  });

  test('exits with status 2 and usage when no directory is given', () => {
    expect(() => execFileSync(join('node_modules', '.bin', 'tsx'), ['scripts/analyze-flaky-tests.ts'], { stdio: 'pipe' }))
      .toThrow(expect.objectContaining({ status: 2 }));
  });
});
