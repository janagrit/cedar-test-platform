import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { FullResult, TestCase, TestResult } from '@playwright/test/reporter';
import SummaryReporter from '@src/reporting/report-summary';

type Outcome = ReturnType<TestCase['outcome']>;

function fakeTest(title: string, outcome: Outcome): TestCase {
  return { outcome: () => outcome, titlePath: () => ['', 'api', 'file.spec.ts', title] } as unknown as TestCase;
}

const result = (duration: number) => ({ duration }) as TestResult;

function run(entries: [TestCase, number[]][]): string {
  const reporter = new SummaryReporter();
  for (const [t, durations] of entries) for (const d of durations) reporter.onTestEnd(t, result(d));
  const logs: string[] = [];
  const original = console.log;
  console.log = (msg: string) => logs.push(msg);
  try {
    reporter.onEnd({ status: 'passed' } as FullResult);
  } finally {
    console.log = original;
  }
  return logs.join('\n');
}

let savedSummary: string | undefined;
test.beforeEach(() => {
  savedSummary = process.env.GITHUB_STEP_SUMMARY;
  delete process.env.GITHUB_STEP_SUMMARY;
});
test.afterEach(() => {
  if (savedSummary !== undefined) process.env.GITHUB_STEP_SUMMARY = savedSummary;
});

test('counts each outcome once, even across retries', () => {
  const output = run([
    [fakeTest('a', 'expected'), [10]],
    [fakeTest('b', 'unexpected'), [10, 10, 10]],
    [fakeTest('c', 'flaky'), [10, 10]],
    [fakeTest('d', 'skipped'), [0]],
  ]);
  expect(output).toContain('| 1 | 1 | 1 | 1 |');
});

test('lists the five slowest tests, summing retry time', () => {
  const tests = Array.from({ length: 7 }, (_, i) => [fakeTest(`t${i}`, 'expected'), [i * 1000]] as [TestCase, number[]]);
  tests.push([fakeTest('retried', 'flaky'), [4000, 4000]]);
  const slowest = run(tests).split('### Slowest tests')[1].trim().split('\n').slice(2);
  expect(slowest).toHaveLength(5);
  expect(slowest[0]).toBe('| api › file.spec.ts › retried | 8.00s |');
  expect(slowest[1]).toContain('t6');
});

test('omits the slowest table when nothing ran', () => {
  expect(run([])).not.toContain('Slowest');
});

test('appends the markdown to GITHUB_STEP_SUMMARY when set', ({}, testInfo) => {
  const file = testInfo.outputPath('summary.md');
  process.env.GITHUB_STEP_SUMMARY = file;
  run([[fakeTest('a', 'expected'), [5]]]);
  run([[fakeTest('b', 'expected'), [5]]]);
  const written = readFileSync(file, 'utf-8');
  expect(written.match(/## Test summary/g)).toHaveLength(2);
});
