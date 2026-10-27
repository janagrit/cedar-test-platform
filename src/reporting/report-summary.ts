import { appendFileSync } from 'node:fs';
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

/** Prints pass/fail/flaky/skip counts and the slowest tests; also writes them to the GitHub job summary. */
export default class SummaryReporter implements Reporter {
  private readonly durations = new Map<TestCase, number>();

  onTestEnd(test: TestCase, result: TestResult): void {
    // Sum across retries so the slowest list reflects real CI time.
    this.durations.set(test, (this.durations.get(test) ?? 0) + result.duration);
  }

  onEnd(result: FullResult): void {
    const counts = { passed: 0, failed: 0, flaky: 0, skipped: 0 };
    for (const test of this.durations.keys()) {
      const outcome = test.outcome();
      if (outcome === 'expected') counts.passed++;
      else if (outcome === 'unexpected') counts.failed++;
      else if (outcome === 'flaky') counts.flaky++;
      else counts.skipped++;
    }
    const slowest = [...this.durations.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    const lines = [
      `## Test summary (${result.status})`,
      '',
      '| Passed | Failed | Flaky | Skipped |',
      '| --- | --- | --- | --- |',
      `| ${counts.passed} | ${counts.failed} | ${counts.flaky} | ${counts.skipped} |`,
    ];
    if (slowest.length > 0) {
      lines.push('', '### Slowest tests', '', '| Test | Duration |', '| --- | --- |');
      for (const [test, ms] of slowest) lines.push(`| ${test.titlePath().filter(Boolean).join(' › ')} | ${(ms / 1000).toFixed(2)}s |`);
    }
    const markdown = lines.join('\n') + '\n';

    console.log('\n' + markdown);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  }

  printsToStdio(): boolean {
    return false;
  }
}
