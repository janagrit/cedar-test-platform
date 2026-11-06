import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

/**
 * Prints one result table at the end of every run, then totals.
 * Known-bug tests (marked test.fail) get their own "Known bug" status instead of
 * being counted as passed. Ported from dili-qa-skeleton's
 * reporters/table-summary-reporter.js, without the cli-table3/chalk dependencies.
 */

export type StatusKey = 'passed' | 'failed' | 'knownbug' | 'skipped' | 'flaky';

interface Row {
  suite: string;
  name: string;
  key: StatusKey;
  duration: string;
}

const LABELS: Record<StatusKey, string> = {
  passed: 'Passed',
  failed: 'Failed',
  knownbug: 'Known bug',
  skipped: 'Skipped',
  flaky: 'Flaky',
};

const COLORS: Record<StatusKey, number> = { passed: 32, failed: 31, knownbug: 36, skipped: 33, flaky: 35 };

export function classify(test: Pick<TestCase, 'outcome'>, result: Pick<TestResult, 'status'>): StatusKey {
  const outcome = test.outcome(); // 'skipped' | 'expected' | 'unexpected' | 'flaky'
  if (result.status === 'skipped' || outcome === 'skipped') return 'skipped';
  // Expected failure: a test.fail() known-bug test that failed as intended.
  if (outcome === 'expected' && result.status !== 'passed') return 'knownbug';
  // Unexpected includes a test.fail() test that now PASSES: the bug is fixed, remove the marker.
  if (outcome === 'unexpected') return 'failed';
  if (outcome === 'flaky') return 'flaky';
  return 'passed';
}

export function formatDuration(ms: number): string {
  if (!ms) return '0s';
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
}

function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    for (let w = word; w.length > 0; ) {
      const room = line ? width - line.length - 1 : width;
      if (w.length <= room) {
        line = line ? `${line} ${w}` : w;
        w = '';
      } else if (line) {
        lines.push(line);
        line = '';
      } else {
        lines.push(w.slice(0, width));
        w = w.slice(width);
      }
    }
  }
  if (line || lines.length === 0) lines.push(line);
  return lines;
}

/** Box-drawn table. `color` wraps a cell's padded text, so ANSI codes never break alignment. */
export function renderTable(
  head: string[],
  rows: string[][],
  widths: number[],
  color?: (row: number, col: number, s: string) => string,
): string {
  const border = (l: string, m: string, r: string) => l + widths.map((w) => '─'.repeat(w + 2)).join(m) + r;
  const renderRow = (cells: string[], rowIndex: number) => {
    const wrapped = cells.map((c, i) => wrap(c, widths[i]));
    const height = Math.max(...wrapped.map((w) => w.length));
    const out: string[] = [];
    for (let h = 0; h < height; h++) {
      const parts = wrapped.map((w, i) => {
        const cell = (w[h] ?? '').padEnd(widths[i]);
        return color && rowIndex >= 0 ? color(rowIndex, i, cell) : cell;
      });
      out.push(`│ ${parts.join(' │ ')} │`);
    }
    return out.join('\n');
  };
  return [
    border('┌', '┬', '┐'),
    renderRow(head, -1),
    border('├', '┼', '┤'),
    ...rows.map((r, i) => renderRow(r, i)),
    border('└', '┴', '┘'),
  ].join('\n');
}

export default class TableSummaryReporter implements Reporter {
  // Keyed by test id so retries collapse to the final attempt.
  private readonly results = new Map<string, Row>();
  private readonly useColor =
    process.env.FORCE_COLOR !== '0' && !process.env.NO_COLOR && (!!process.stdout.isTTY || !!process.env.FORCE_COLOR);

  onTestEnd(test: TestCase, result: TestResult): void {
    const [, project, file] = test.titlePath();
    const describe = test.parent?.title && test.parent.title !== file ? ` › ${test.parent.title}` : '';
    this.results.set(test.id, {
      suite: `${project ? `${project} › ` : ''}${file ?? ''}${describe}`,
      name: test.title,
      key: classify(test, result),
      duration: formatDuration(result.duration),
    });
  }

  onEnd(): void {
    const paint = (key: StatusKey, s: string) => (this.useColor ? `\x1b[${COLORS[key]}m${s}\x1b[0m` : s);
    const bold = (s: string) => (this.useColor ? `\x1b[1m${s}\x1b[0m` : s);
    // Tests finish in parallel; sort so the table reads file by file.
    const rows = [...this.results.values()].sort((a, b) => a.suite.localeCompare(b.suite));
    if (rows.length === 0) {
      console.log('\nNo test results recorded.');
      return;
    }

    const table = renderTable(
      ['Test Suite', 'Test Name', 'Status', 'Duration'],
      rows.map((r) => [r.suite, r.name, LABELS[r.key], r.duration]),
      [34, 60, 9, 8],
      (row, col, s) => (col === 2 ? paint(rows[row].key, s) : s),
    );

    const count = (key: StatusKey) => rows.filter((r) => r.key === key).length;
    const lines = [
      '',
      table,
      '',
      bold(`Total: ${rows.length}`),
      paint('passed', `Passed: ${count('passed')}`),
      paint('failed', `Failed: ${count('failed')}`),
      paint('knownbug', `Known bugs (expected fail): ${count('knownbug')}`),
    ];
    if (count('flaky')) lines.push(paint('flaky', `Flaky: ${count('flaky')}`));
    lines.push(paint('skipped', `Skipped: ${count('skipped')}`));
    console.log(lines.join('\n'));
  }

  printsToStdio(): boolean {
    return false;
  }
}
