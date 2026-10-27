import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { XMLParser } from 'fast-xml-parser';

// Flaky-test detection over JUnit XML (pytest or Playwright). Used by scripts/analyze-flaky-tests.ts.

export interface Run {
  passed: boolean;
  message: string;
}

export interface FlakyTest {
  testId: string;
  failRate: number;
  runs: number;
  firstFailure: string;
}

type XmlNode = Record<string, unknown>;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  isArray: (name) => ['testsuite', 'testcase', 'failure', 'error'].includes(name),
});

function collectTestCases(node: unknown, out: XmlNode[]): void {
  if (Array.isArray(node)) {
    for (const child of node) collectTestCases(child, out);
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === 'testcase') out.push(...(value as XmlNode[]));
      else collectTestCases(value, out);
    }
  }
}

function failureMessage(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const message = (node as XmlNode).message;
  return typeof message === 'string' ? message.trim() : '';
}

/** Read every *.xml under directory (recursively) into test id -> runs. Skipped cases are ignored. */
export function loadResults(directory: string): Map<string, Run[]> {
  const results = new Map<string, Run[]>();
  const files = readdirSync(directory, { recursive: true, encoding: 'utf-8' }).filter((f) => f.endsWith('.xml'));
  for (const file of files) {
    const cases: XmlNode[] = [];
    collectTestCases(parser.parse(readFileSync(join(directory, file), 'utf-8')), cases);
    for (const testCase of cases) {
      if ('skipped' in testCase) continue;
      const testId = `${testCase.classname ?? ''}::${testCase.name ?? ''}`;
      const failures = [...((testCase.failure as unknown[]) ?? []), ...((testCase.error as unknown[]) ?? [])];
      const run: Run = { passed: failures.length === 0, message: failureMessage(failures[0]) };
      results.set(testId, [...(results.get(testId) ?? []), run]);
    }
  }
  return results;
}

/** A test is flaky when it has both passes and failures across at least minRuns runs. Sorted by fail rate. */
export function findFlaky(results: Map<string, Run[]>, minRuns: number): FlakyTest[] {
  const flaky: FlakyTest[] = [];
  for (const [testId, runs] of results) {
    if (runs.length < minRuns) continue;
    const passes = runs.filter((r) => r.passed).length;
    if (passes > 0 && passes < runs.length) {
      flaky.push({
        testId,
        failRate: (100 * (runs.length - passes)) / runs.length,
        runs: runs.length,
        firstFailure: runs.find((r) => !r.passed && r.message)?.message ?? '(no message)',
      });
    }
  }
  return flaky.sort((a, b) => b.failRate - a.failRate);
}
