#!/usr/bin/env python3
"""Flag flaky tests from JUnit XML files collected across CI runs.

Usage: python3 tools/flaky_report.py <dir-with-junit-xml> [--min-runs 3]

A test is flaky when it has both passing and failing results in the sample.
Output lists flake rate, runs seen, and the first failure message.
"""
import glob
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict


def load_results(directory: str) -> dict:
    results = defaultdict(list)  # test id -> list of (passed: bool, message: str)
    for path in glob.glob(f"{directory}/**/*.xml", recursive=True):
        for case in ET.parse(path).iter("testcase"):
            test_id = f"{case.get('classname', '')}::{case.get('name', '')}"
            failure = case.find("failure") or case.find("error")
            skipped = case.find("skipped") is not None
            if skipped:
                continue
            msg = (failure.get("message") or "").strip() if failure is not None else ""
            results[test_id].append((failure is None, msg))
    return results


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    min_runs = int(sys.argv[sys.argv.index("--min-runs") + 1]) if "--min-runs" in sys.argv else 3
    results = load_results(sys.argv[1])
    flaky = []
    for test_id, runs in results.items():
        if len(runs) < min_runs:
            continue
        passes = sum(1 for ok, _ in runs if ok)
        if 0 < passes < len(runs):
            fail_rate = 100 * (len(runs) - passes) / len(runs)
            first_msg = next((m for ok, m in runs if not ok and m), "(no message)")
            flaky.append((fail_rate, test_id, len(runs), first_msg))
    if not flaky:
        print("No flaky tests found.")
        return
    print(f"{len(flaky)} flaky test(s):")
    for rate, test_id, n, msg in sorted(flaky, reverse=True):
        print(f"- {test_id}  fail {rate:.0f}% over {n} runs  | {msg[:120]}")


if __name__ == "__main__":
    main()
