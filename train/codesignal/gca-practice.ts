/**
 * Practice set (CodeSignal General Coding Assessment style): 4 problems, easy -> hard.
 * Set a 70-minute timer. Write your code here, then run `npx tsx --test train/codesignal/gca.test.ts`.
 *
 * Q1. countEqualToNeighbors(numbers: number[]): number
 *     Count positions i where numbers[i] equals the sum of its neighbors.
 *     The first and last items have only one neighbor; a single item has none (sum 0).
 *     Example: [1, 3, 2, 5, 3] -> 2  (3 = 1 + 2, and 5 = 2 + 3)
 *
 * Q2. longestRun(s: string): [string, number]
 *     Return the character with the longest run of the same character in a row, and the run length.
 *     If two runs have the same length, return the one that comes first. Empty string -> ["", 0].
 *     Example: "aabbbcccc" -> ["c", 4]
 *
 * Q3. spiralOrder(matrix: number[][]): number[]
 *     Return all items in clockwise spiral order, starting at the top-left corner.
 *     The matrix can be non-square or empty.
 *     Example: [[1, 2, 3],
 *               [4, 5, 6],
 *               [7, 8, 9]] -> [1, 2, 3, 6, 9, 8, 7, 4, 5]
 *
 * Q4. countPowerOfTwoPairs(nums: number[]): number
 *     Count pairs (i, j), i < j, where nums[i] + nums[j] is a power of two (1, 2, 4, 8, ...).
 *     0 <= nums[i] <= 2**20, nums.length up to 100000, so O(n^2) is too slow.
 *     Example: [1, 3, 5, 7] -> 3  (1+3=4, 1+7=8, 3+5=8)
 */

export function countEqualToNeighbors(numbers: number[]): number {
  throw new Error('Not implemented');
}

export function longestRun(s: string): [string, number] {
  throw new Error('Not implemented');
}

export function spiralOrder(matrix: number[][]): number[] {
  throw new Error('Not implemented');
}

export function countPowerOfTwoPairs(nums: number[]): number {
  throw new Error('Not implemented');
}
