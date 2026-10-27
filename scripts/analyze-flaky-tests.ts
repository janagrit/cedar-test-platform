/**
 * Flag flaky tests from JUnit XML files collected across CI runs.
 *
 * Usage: tsx scripts/analyze-flaky-tests.ts <dir-with-junit-xml> [--min-runs 3] [--json]
 *
 * A test is flaky when it has both passing and failing results in the sample.
 * Reads Playwright and pytest JUnit output. Port of tools/flaky_report.py.
 */
import { findFlaky, loadResults } from '../src/reporting/flaky-analysis';

function main(): void {
  const args = process.argv.slice(2);
  const directory = args[0];
  if (!directory || directory.startsWith('--')) {
    console.error('Usage: tsx scripts/analyze-flaky-tests.ts <dir-with-junit-xml> [--min-runs 3] [--json]');
    process.exit(2);
  }
  const minRunsIndex = args.indexOf('--min-runs');
  const minRuns = minRunsIndex >= 0 ? Number(args[minRunsIndex + 1]) : 3;
  const flaky = findFlaky(loadResults(directory), minRuns);

  if (args.includes('--json')) {
    console.log(JSON.stringify(flaky, null, 2));
    return;
  }
  if (flaky.length === 0) {
    console.log('No flaky tests found.');
    return;
  }
  console.log(`${flaky.length} flaky test(s):`);
  for (const t of flaky) {
    console.log(`- ${t.testId}  fail ${t.failRate.toFixed(0)}% over ${t.runs} runs  | ${t.firstFailure.slice(0, 120)}`);
  }
}

main();
