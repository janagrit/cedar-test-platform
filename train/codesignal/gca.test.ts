/**
 * Tests for the GCA practice set.
 *
 *   npx tsx --test train/codesignal/gca.test.ts                 # tests your gca-practice.ts
 *   IMPL=solution npx tsx --test train/codesignal/gca.test.ts   # tests solution-gca.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as mine from './gca-practice';
import * as reference from './solution-gca';

const gca = process.env.IMPL === 'solution' ? reference : mine;

describe('Q1 countEqualToNeighbors', () => {
  it('example', () => {
    assert.equal(gca.countEqualToNeighbors([1, 3, 2, 5, 3]), 2);
  });

  it('edge cases', () => {
    assert.equal(gca.countEqualToNeighbors([]), 0);
    assert.equal(gca.countEqualToNeighbors([0]), 1); // no neighbors, sum 0
    assert.equal(gca.countEqualToNeighbors([5]), 0);
    assert.equal(gca.countEqualToNeighbors([4, 4]), 2); // each equals its only neighbor
  });
});

describe('Q2 longestRun', () => {
  it('example', () => {
    assert.deepEqual(gca.longestRun('aabbbcccc'), ['c', 4]);
  });

  it('tie returns the first run', () => {
    assert.deepEqual(gca.longestRun('aabb'), ['a', 2]);
  });

  it('edge cases', () => {
    assert.deepEqual(gca.longestRun(''), ['', 0]);
    assert.deepEqual(gca.longestRun('z'), ['z', 1]);
    assert.deepEqual(gca.longestRun('abba'), ['b', 2]);
  });
});

describe('Q3 spiralOrder', () => {
  it('square', () => {
    assert.deepEqual(gca.spiralOrder([[1, 2, 3], [4, 5, 6], [7, 8, 9]]), [1, 2, 3, 6, 9, 8, 7, 4, 5]);
  });

  it('rectangle', () => {
    assert.deepEqual(
      gca.spiralOrder([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]),
      [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7],
    );
  });

  it('single row and single column', () => {
    assert.deepEqual(gca.spiralOrder([[1, 2, 3]]), [1, 2, 3]);
    assert.deepEqual(gca.spiralOrder([[1], [2], [3]]), [1, 2, 3]);
  });

  it('empty', () => {
    assert.deepEqual(gca.spiralOrder([]), []);
    assert.deepEqual(gca.spiralOrder([[]]), []);
  });
});

describe('Q4 countPowerOfTwoPairs', () => {
  it('example', () => {
    assert.equal(gca.countPowerOfTwoPairs([1, 3, 5, 7]), 3);
  });

  it('duplicates and zero', () => {
    assert.equal(gca.countPowerOfTwoPairs([1, 1, 1]), 3); // every pair sums to 2
    assert.equal(gca.countPowerOfTwoPairs([0, 1, 2]), 2); // 0+1, 0+2
    assert.equal(gca.countPowerOfTwoPairs([0, 0]), 0); // 0 is not a power of two
  });

  it('large input is fast', () => {
    const nums = Array.from({ length: 100000 }, (_, i) => i % 1000);
    const start = Date.now();
    gca.countPowerOfTwoPairs(nums);
    assert.ok(Date.now() - start < 5000, "too slow: O(n^2) won't pass on CodeSignal");
  });
});
