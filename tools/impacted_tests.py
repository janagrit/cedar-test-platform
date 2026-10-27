#!/usr/bin/env python3
"""Print the test paths affected by changed files, or 'ALL' when unsure.

Usage: python3 tools/impacted_tests.py [--base origin/main] [--map test_map.json]

Rules:
- Each key in test_map.json is a path prefix; its value is a list of test paths.
- A changed file matching no key, or matching a key listed under "always_full", returns ALL.
- The safe default is the full suite: a missed test is worse than a slow run.
"""
import json
import os
import subprocess
import sys


def changed_files(base: str) -> list[str]:
    out = subprocess.run(["git", "diff", "--name-only", f"{base}...HEAD"],
                         capture_output=True, text=True, check=True).stdout
    return [line for line in out.splitlines() if line]


def main() -> None:
    base = sys.argv[sys.argv.index("--base") + 1] if "--base" in sys.argv else "origin/main"
    map_path = sys.argv[sys.argv.index("--map") + 1] if "--map" in sys.argv else os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "..", "test_map.json")
    mapping = json.load(open(map_path, encoding="utf-8"))
    full_triggers = mapping.get("always_full", [])
    files = changed_files(base)
    if not files:
        print("")  # nothing changed, nothing to run
        return
    selected: set[str] = set()
    for f in files:
        if any(f.startswith(t) for t in full_triggers):
            print("ALL")
            return
        matches = [k for k in mapping if k != "always_full" and f.startswith(k)]
        if not matches:
            print("ALL")
            return
        for k in matches:
            selected.update(mapping[k])
    print(" ".join(sorted(selected)))


if __name__ == "__main__":
    main()
