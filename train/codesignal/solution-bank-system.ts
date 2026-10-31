/** Reference solution for bank-system.ts. Try the task yourself before reading this. */

const CASHBACK_DELAY = 86400000;
const CASHBACK_PERCENT = 2;

interface Account {
  balance: number;
  outgoing: number;
  created: number;
  history: Array<[timestamp: number, balance: number]>;
  mergedAt?: number;
}

interface Payment {
  account: string;
  amount: number;
  cashbackAt: number;
  received: boolean;
}

export class BankSystem {
  private accounts = new Map<string, Account>();
  // Merged-away accounts are kept so getBalance still works for times before the merge.
  private merged = new Map<string, Account>();
  private payments = new Map<string, Payment>();
  // Payment ids waiting for cashback, in cashbackAt order.
  private pending: string[] = [];
  private paymentCount = 0;

  private record(accountId: string, timestamp: number): void {
    const acc = this.accounts.get(accountId)!;
    acc.history.push([timestamp, acc.balance]);
  }

  private processCashbacks(timestamp: number): void {
    // Cashback is applied at its own due time, so history stays correct for getBalance.
    while (this.pending.length && this.payments.get(this.pending[0])!.cashbackAt <= timestamp) {
      const p = this.payments.get(this.pending.shift()!)!;
      this.accounts.get(p.account)!.balance += Math.floor((p.amount * CASHBACK_PERCENT) / 100);
      p.received = true;
      this.record(p.account, p.cashbackAt);
    }
  }

  // Level 1
  createAccount(timestamp: number, accountId: string): boolean {
    this.processCashbacks(timestamp);
    if (this.accounts.has(accountId) || this.merged.has(accountId)) return false;
    this.accounts.set(accountId, { balance: 0, outgoing: 0, created: timestamp, history: [] });
    this.record(accountId, timestamp);
    return true;
  }

  deposit(timestamp: number, accountId: string, amount: number): number | null {
    this.processCashbacks(timestamp);
    const acc = this.accounts.get(accountId);
    if (!acc) return null;
    acc.balance += amount;
    this.record(accountId, timestamp);
    return acc.balance;
  }

  transfer(timestamp: number, sourceId: string, targetId: string, amount: number): number | null {
    this.processCashbacks(timestamp);
    const source = this.accounts.get(sourceId);
    const target = this.accounts.get(targetId);
    if (!source || !target || sourceId === targetId || source.balance < amount) return null;
    source.balance -= amount;
    source.outgoing += amount;
    target.balance += amount;
    this.record(sourceId, timestamp);
    this.record(targetId, timestamp);
    return source.balance;
  }

  // Level 2
  topSpenders(timestamp: number, n: number): string[] {
    this.processCashbacks(timestamp);
    return [...this.accounts]
      // Plain < comparison, not localeCompare: ids are compared character by character.
      .sort(([idA, a], [idB, b]) => b.outgoing - a.outgoing || (idA < idB ? -1 : 1))
      .slice(0, n)
      .map(([id, acc]) => `${id}(${acc.outgoing})`);
  }

  // Level 3
  pay(timestamp: number, accountId: string, amount: number): string | null {
    this.processCashbacks(timestamp);
    const acc = this.accounts.get(accountId);
    if (!acc || acc.balance < amount) return null;
    acc.balance -= amount;
    acc.outgoing += amount;
    this.record(accountId, timestamp);
    const paymentId = `payment${++this.paymentCount}`;
    this.payments.set(paymentId, {
      account: accountId,
      amount,
      cashbackAt: timestamp + CASHBACK_DELAY,
      received: false,
    });
    // Timestamps only go up, so pushing keeps pending sorted by cashbackAt.
    this.pending.push(paymentId);
    return paymentId;
  }

  getPaymentStatus(timestamp: number, accountId: string, payment: string): string | null {
    this.processCashbacks(timestamp);
    const p = this.payments.get(payment);
    if (!this.accounts.has(accountId) || !p || p.account !== accountId) return null;
    return p.received ? 'CASHBACK_RECEIVED' : 'IN_PROGRESS';
  }

  // Level 4
  mergeAccounts(timestamp: number, accountId1: string, accountId2: string): boolean {
    this.processCashbacks(timestamp);
    const acc1 = this.accounts.get(accountId1);
    const acc2 = this.accounts.get(accountId2);
    if (!acc1 || !acc2 || accountId1 === accountId2) return false;
    acc1.balance += acc2.balance;
    acc1.outgoing += acc2.outgoing;
    for (const p of this.payments.values()) {
      if (p.account === accountId2) p.account = accountId1;
    }
    acc2.mergedAt = timestamp;
    this.accounts.delete(accountId2);
    this.merged.set(accountId2, acc2);
    this.record(accountId1, timestamp);
    return true;
  }

  getBalance(timestamp: number, accountId: string, timeAt: number): number | null {
    this.processCashbacks(timestamp);
    const acc = this.accounts.get(accountId) ?? this.merged.get(accountId);
    if (!acc || timeAt < acc.created) return null;
    if (acc.mergedAt !== undefined && timeAt >= acc.mergedAt) return null;
    // Binary search: last history entry with time <= timeAt (history[0] is creation, so one exists).
    const h = acc.history;
    let lo = 0;
    let hi = h.length - 1;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (h[mid][0] <= timeAt) lo = mid;
      else hi = mid - 1;
    }
    return h[lo][1];
  }
}
