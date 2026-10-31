# CodeSignal prep

Cedar uses CodeSignal for the coding part. **Ask your recruiter which format you'll get**, because
the prep is different for each:

| Format | What it is | How to prepare |
|---|---|---|
| **Industry Coding Framework (ICF)** (most likely for an engineering role) | One task in **4 levels**, about 90 min. You build a class (e.g. bank, in-memory database, file storage). Each level adds features to the same code. Unit tests are given; your score = tests passed per level. | Practice: `codesignal/bank-system.ts` |
| **General Coding Assessment (GCA)** | 4 separate problems in 70 min, easy → hard. | Practice: `codesignal/gca-practice.ts` |
| **Live interview in CodeSignal** | Same editor, but with an interviewer watching and talking. | Use the ICF practice and **talk while you code** |

> These format details come from what candidates usually report and can change. Confirm with the
> recruiter: format, time limit, languages, and whether you can look up docs during the test.

---

## How to practice here

TypeScript, run with `tsx` and Node's built-in test runner (`node:test`). Nothing extra to
install beyond `npm install`. Run from the repo root:

```bash
# Bank system (ICF style). Write your code in train/codesignal/bank-system.ts, then:
npx tsx --test train/codesignal/bank-system.test.ts                 # tests your code
IMPL=solution npx tsx --test train/codesignal/bank-system.test.ts   # tests the reference solution

# One level at a time:
npx tsx --test --test-name-pattern="Level 1" train/codesignal/bank-system.test.ts

# Re-run on every save (closest to CodeSignal's "Run tests" loop):
npx tsx --test --watch train/codesignal/bank-system.test.ts

# GCA style: write your code in train/codesignal/gca-practice.ts, then:
npx tsx --test train/codesignal/gca.test.ts
IMPL=solution npx tsx --test train/codesignal/gca.test.ts
```

The full task description is at the top of `codesignal/bank-system.ts`.

**Practice plan:** do the bank system once **with a 90-minute timer**, without looking at the solution.
Then compare your code with `solution-bank-system.ts`. A few days later, do it again from scratch.

---

## ICF strategy (the 4-level task)

1. **Read the whole level 1 spec slowly** (2–3 min). Note exact return values: `None` vs `False` vs `""`,
   string formats like `"acc1(300)"`, and how to sort ties.
2. **Design the data for later levels.** Keep one dict per account from the start
   (`{"balance": .., "outgoing": .., "history": [..]}`). Then later levels add fields instead of making you rewrite.
3. **Make level 1 pass fast.** Don't over-engineer. Most of the score comes from levels 1–3.
4. **Run the tests after every method.** Read the failing test's input and expected output. The tests are the real spec.
5. **Levels 3–4 usually add time** (timestamps, TTL, scheduled events, history). Common trick:
   process pending events with `timestamp <= now` at the **start of every method**.
6. **Watch the clock.** If level 4 is stuck with 10 min left, go back and make sure levels 1–3 pass 100%.
7. Copy-paste is fine. Clean code is good, but passing tests count more.

### Typical ICF themes (practice building each one)
- **Bank:** create account, deposit, transfer → top spenders → scheduled payments with cashback → merge accounts, balance at a past time.
- **In-memory database:** set/get/delete fields → scan by prefix → TTL (values expire) → backup/restore at a timestamp.
- **File storage:** add/get/delete file → find by prefix/suffix, sorted by size → users with storage limits → backup/restore per user.
- **Task queue / job scheduler:** add tasks with priority → assign to workers → time-outs → history and statistics.

### TypeScript tools you'll use all the time
```ts
const accounts = new Map<string, Account>();     // use Map, not a plain object, for dynamic keys
accounts.get(id) ?? null                         // Map.get returns undefined; tests often want null
counts.set(x, (counts.get(x) ?? 0) + 1);         // counter (no Counter in TS)

// value desc, then id asc (tie-break!). Use < for ids, not localeCompare.
[...accounts].sort(([idA, a], [idB, b]) => b.total - a.total || (idA < idB ? -1 : 1));

`${id}(${total})`                                 // string formats like "acc1(300)"
Math.floor((amount * 2) / 100)                    // integer percentage, rounds down
```

**TypeScript traps that cost points:**
- `[10, 9, 1].sort()` gives `[1, 10, 9]` (compares as strings). Always pass a comparator for numbers: `.sort((a, b) => a - b)`.
- Returning `undefined` where the spec says `null`. Strict tests fail on it.
- `5 / 2` is `2.5`, not `2`. Use `Math.floor` when the spec says integer.
- No built-in binary search, heap, or deque. Write a 6-line binary search (see `getBalance` in
  `solution-bank-system.ts`); for a small queue, `array.shift()` is fine.
- `for (const x in arr)` gives indexes as strings. Use `for (const x of arr)`.

---

## GCA strategy (4 separate problems)

- Q1 and Q2 are short (array/string loops). Do them in about 10 min total, but read edge cases carefully.
- Q3 is usually a matrix or a simulation. Be careful with indexes.
- Q4 needs a faster algorithm (hashmap, prefix sums, sorting, two pointers). A brute force O(n²) will
  time out on big inputs. Submit brute force first if stuck, since partial points count, then optimize.
- Practice topics: strings, arrays, hashmaps, sorting with custom keys, 2D matrix walking,
  sliding window, prefix sums, two pointers, simple simulation.

---

## Before the test
- Use a quiet room, a stable connection, and a webcam (proctored tests record you). Close other apps.
- Select **TypeScript** as the language at the start (CodeSignal lets you choose). Check the version it
  uses and whether the starter code uses `null` or `undefined`.
- Do the CodeSignal practice question to learn the editor and the "Run tests" button.
- During a live interview: say your plan, say what you're testing, and say when you're choosing speed over clean code.
