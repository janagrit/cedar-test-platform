/**
 * Practice task (CodeSignal Industry Coding Framework style): a simple banking system.
 *
 * Write your code in this file. Run `npx tsx --test train/codesignal/bank-system.test.ts` to check it.
 * Set a 90-minute timer. Do the levels in order; each level builds on the previous one.
 *
 * General rules
 * - Every method gets `timestamp` (number, milliseconds) first. Timestamps in calls only go up.
 * - Account ids are strings. Amounts are positive integers.
 * - "Not found / not allowed" results are `null` (not `undefined`).
 * - An account id is never reused: once created (even if later merged away), it can't be created again.
 *
 * Level 1
 * - createAccount(timestamp, accountId): boolean
 *     Creates an account with balance 0. Returns false if the id already exists (or existed).
 * - deposit(timestamp, accountId, amount): number | null
 *     Adds money. Returns the new balance, or null if the account doesn't exist.
 * - transfer(timestamp, sourceId, targetId, amount): number | null
 *     Moves money from source to target. Returns the source's new balance.
 *     Returns null if either account doesn't exist, if source === target,
 *     or if source doesn't have enough money.
 *
 * Level 2
 * - topSpenders(timestamp, n): string[]
 *     Returns the top n accounts by total outgoing money, as strings "accountId(total)".
 *     Outgoing = successful transfers sent + payments (level 3).
 *     Sort by total descending, then by accountId ascending. If fewer than n accounts, return all.
 *
 * Level 3
 * - pay(timestamp, accountId, amount): string | null
 *     Withdraws money. Returns a payment id: "payment1", "payment2", ... (one counter for the
 *     whole system, counting only successful payments).
 *     Returns null if the account doesn't exist or doesn't have enough money.
 *     Cashback: 2% of the amount, rounded down, is added to the account exactly
 *     86400000 ms (24 h) after the payment. Cashback due at time T is applied before
 *     any other operation at time T.
 * - getPaymentStatus(timestamp, accountId, payment): string | null
 *     Returns "IN_PROGRESS" or "CASHBACK_RECEIVED".
 *     Returns null if the account doesn't exist, the payment doesn't exist,
 *     or the payment doesn't belong to this account.
 *
 * Level 4
 * - mergeAccounts(timestamp, accountId1, accountId2): boolean
 *     Moves everything from account 2 into account 1, then account 2 stops existing.
 *     Balance and outgoing total are added to account 1. Account 2's payments now belong to
 *     account 1 (their cashback goes to account 1).
 *     Returns false if either account doesn't exist or the ids are the same.
 * - getBalance(timestamp, accountId, timeAt): number | null
 *     Returns the account's balance at time `timeAt` (timeAt <= timestamp), counting all
 *     operations with timestamp <= timeAt.
 *     Returns null if the account didn't exist at timeAt
 *     (not created yet, or already merged into another account).
 */

export class BankSystem {
  constructor() {}

  // Level 1
  createAccount(timestamp: number, accountId: string): boolean {
    throw new Error('Not implemented');
  }

  deposit(timestamp: number, accountId: string, amount: number): number | null {
    throw new Error('Not implemented');
  }

  transfer(timestamp: number, sourceId: string, targetId: string, amount: number): number | null {
    throw new Error('Not implemented');
  }

  // Level 2
  topSpenders(timestamp: number, n: number): string[] {
    throw new Error('Not implemented');
  }

  // Level 3
  pay(timestamp: number, accountId: string, amount: number): string | null {
    throw new Error('Not implemented');
  }

  getPaymentStatus(timestamp: number, accountId: string, payment: string): string | null {
    throw new Error('Not implemented');
  }

  // Level 4
  mergeAccounts(timestamp: number, accountId1: string, accountId2: string): boolean {
    throw new Error('Not implemented');
  }

  getBalance(timestamp: number, accountId: string, timeAt: number): number | null {
    throw new Error('Not implemented');
  }
}
