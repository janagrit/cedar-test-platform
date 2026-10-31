/** Reference solutions for gca-practice.ts. Try the problems yourself before reading this. */

export function countEqualToNeighbors(numbers: number[]): number {
  let count = 0;
  numbers.forEach((value, i) => {
    const left = i > 0 ? numbers[i - 1] : 0;
    const right = i < numbers.length - 1 ? numbers[i + 1] : 0;
    if (value === left + right) count++;
  });
  return count;
}

export function longestRun(s: string): [string, number] {
  let bestChar = '';
  let bestLen = 0;
  let i = 0;
  while (i < s.length) {
    let j = i;
    while (j < s.length && s[j] === s[i]) j++;
    if (j - i > bestLen) {
      // strict > keeps the first run on a tie
      bestChar = s[i];
      bestLen = j - i;
    }
    i = j;
  }
  return [bestChar, bestLen];
}

export function spiralOrder(matrix: number[][]): number[] {
  const result: number[] = [];
  if (!matrix.length || !matrix[0].length) return result;
  let top = 0;
  let bottom = matrix.length - 1;
  let left = 0;
  let right = matrix[0].length - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) result.push(matrix[top][c]);
    for (let r = top + 1; r <= bottom; r++) result.push(matrix[r][right]);
    // A single row or column was already fully read above.
    if (top < bottom) for (let c = right - 1; c >= left; c--) result.push(matrix[bottom][c]);
    if (left < right) for (let r = bottom - 1; r > top; r--) result.push(matrix[r][left]);
    top++;
    bottom--;
    left++;
    right--;
  }
  return result;
}

export function countPowerOfTwoPairs(nums: number[]): number {
  // For each number, look up how many earlier numbers complete it to each power of two.
  // O(n * 22) instead of O(n^2).
  const seen = new Map<number, number>();
  const powers = Array.from({ length: 22 }, (_, k) => 2 ** k); // max sum is 2 * 2**20 = 2**21
  let count = 0;
  for (const x of nums) {
    for (const p of powers) count += seen.get(p - x) ?? 0;
    seen.set(x, (seen.get(x) ?? 0) + 1);
  }
  return count;
}
