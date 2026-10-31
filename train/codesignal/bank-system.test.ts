/**
 * Tests for the bank system practice task, one describe() per level.
 *
 *   npx tsx --test train/codesignal/bank-system.test.ts                 # tests your bank-system.ts
 *   IMPL=solution npx tsx --test train/codesignal/bank-system.test.ts   # tests solution-bank-system.ts
 *   npx tsx --test --test-name-pattern="Level 1" train/codesignal/bank-system.test.ts
 */
import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as mine from './bank-system';
import * as reference from './solution-bank-system';

const { BankSystem } = process.env.IMPL === 'solution' ? reference : mine;
type Bank = InstanceType<typeof BankSystem>;

const DAY = 86400000;

describe('Level 1', () => {
  let bank: Bank;
  beforeEach(() => {
    bank = new BankSystem();
  });

  it('createAccount', () => {
    assert.equal(bank.createAccount(1, 'acc1'), true);
    assert.equal(bank.createAccount(2, 'acc2'), true);
    assert.equal(bank.createAccount(3, 'acc1'), false);
  });

  it('deposit', () => {
    bank.createAccount(1, 'acc1');
    assert.equal(bank.deposit(2, 'acc1', 500), 500);
    assert.equal(bank.deposit(3, 'acc1', 250), 750);
    assert.equal(bank.deposit(4, 'missing', 100), null);
  });

  it('transfer', () => {
    bank.createAccount(1, 'acc1');
    bank.createAccount(2, 'acc2');
    bank.deposit(3, 'acc1', 1000);
    assert.equal(bank.transfer(4, 'acc1', 'acc2', 300), 700);
    assert.equal(bank.deposit(5, 'acc2', 0), 300);
  });

  it('transfer: invalid cases return null and change nothing', () => {
    bank.createAccount(1, 'acc1');
    bank.createAccount(2, 'acc2');
    bank.deposit(3, 'acc1', 100);
    assert.equal(bank.transfer(4, 'acc1', 'acc2', 101), null); // not enough money
    assert.equal(bank.transfer(5, 'acc1', 'acc1', 10), null); // same account
    assert.equal(bank.transfer(6, 'acc1', 'missing', 10), null);
    assert.equal(bank.transfer(7, 'missing', 'acc1', 10), null);
    assert.equal(bank.deposit(8, 'acc1', 0), 100);
  });

  it('transfer: whole balance', () => {
    bank.createAccount(1, 'acc1');
    bank.createAccount(2, 'acc2');
    bank.deposit(3, 'acc1', 100);
    assert.equal(bank.transfer(4, 'acc1', 'acc2', 100), 0);
  });
});

describe('Level 2', () => {
  let bank: Bank;
  beforeEach(() => {
    bank = new BankSystem();
    ['acc1', 'acc2', 'acc3'].forEach((acc, i) => {
      bank.createAccount(i + 1, acc);
      bank.deposit(10 + i, acc, 1000);
    });
  });

  it('topSpenders: sorted by outgoing', () => {
    bank.transfer(20, 'acc1', 'acc2', 100);
    bank.transfer(21, 'acc3', 'acc1', 300);
    bank.transfer(22, 'acc2', 'acc1', 50);
    assert.deepEqual(bank.topSpenders(30, 3), ['acc3(300)', 'acc1(100)', 'acc2(50)']);
  });

  it('topSpenders: tie broken by id', () => {
    bank.transfer(20, 'acc3', 'acc1', 100);
    bank.transfer(21, 'acc1', 'acc2', 100);
    assert.deepEqual(bank.topSpenders(30, 3), ['acc1(100)', 'acc3(100)', 'acc2(0)']);
  });

  it('topSpenders: n bigger than number of accounts', () => {
    assert.deepEqual(bank.topSpenders(30, 10), ['acc1(0)', 'acc2(0)', 'acc3(0)']);
  });

  it('topSpenders: failed transfer not counted', () => {
    bank.transfer(20, 'acc1', 'acc2', 5000);
    assert.deepEqual(bank.topSpenders(30, 1), ['acc1(0)']);
  });
});

describe('Level 3', () => {
  let bank: Bank;
  beforeEach(() => {
    bank = new BankSystem();
    bank.createAccount(1, 'acc1');
    bank.createAccount(2, 'acc2');
    bank.deposit(3, 'acc1', 1000);
  });

  it('pay returns payment ids', () => {
    assert.equal(bank.pay(10, 'acc1', 300), 'payment1');
    assert.equal(bank.pay(11, 'acc2', 1), null); // not enough money
    assert.equal(bank.pay(12, 'missing', 1), null);
    assert.equal(bank.pay(13, 'acc1', 100), 'payment2');
    assert.equal(bank.deposit(14, 'acc1', 0), 600);
  });

  it('cashback arrives exactly 24h later, before other operations at that time', () => {
    bank.pay(10, 'acc1', 250); // cashback = 5
    assert.equal(bank.deposit(10 + DAY - 1, 'acc1', 0), 750);
    assert.equal(bank.getPaymentStatus(10 + DAY - 1, 'acc1', 'payment1'), 'IN_PROGRESS');
    assert.equal(bank.deposit(10 + DAY, 'acc1', 0), 755);
    assert.equal(bank.getPaymentStatus(10 + DAY, 'acc1', 'payment1'), 'CASHBACK_RECEIVED');
  });

  it('cashback rounds down', () => {
    bank.pay(10, 'acc1', 149); // 2% of 149 = 2.98 -> 2
    assert.equal(bank.deposit(10 + DAY, 'acc1', 0), 1000 - 149 + 2);
  });

  it('getPaymentStatus: invalid cases return null', () => {
    bank.pay(10, 'acc1', 100);
    assert.equal(bank.getPaymentStatus(11, 'acc2', 'payment1'), null); // wrong account
    assert.equal(bank.getPaymentStatus(12, 'acc1', 'payment99'), null);
    assert.equal(bank.getPaymentStatus(13, 'missing', 'payment1'), null);
  });

  it('payments count in topSpenders', () => {
    bank.pay(10, 'acc1', 100);
    bank.transfer(11, 'acc1', 'acc2', 50);
    assert.deepEqual(bank.topSpenders(12, 2), ['acc1(150)', 'acc2(0)']);
  });

  it('cashback does not change outgoing', () => {
    bank.pay(10, 'acc1', 500);
    assert.deepEqual(bank.topSpenders(10 + DAY, 1), ['acc1(500)']);
  });
});

describe('Level 4', () => {
  let bank: Bank;
  beforeEach(() => {
    bank = new BankSystem();
    bank.createAccount(1, 'acc1');
    bank.createAccount(2, 'acc2');
    bank.deposit(3, 'acc1', 1000);
    bank.deposit(4, 'acc2', 500);
  });

  it('mergeAccounts', () => {
    bank.transfer(5, 'acc2', 'acc1', 100);
    assert.equal(bank.mergeAccounts(10, 'acc1', 'acc2'), true);
    assert.equal(bank.deposit(11, 'acc1', 0), 1500);
    assert.equal(bank.deposit(12, 'acc2', 10), null);
    assert.deepEqual(bank.topSpenders(13, 5), ['acc1(100)']);
  });

  it('mergeAccounts: invalid cases', () => {
    assert.equal(bank.mergeAccounts(10, 'acc1', 'acc1'), false);
    assert.equal(bank.mergeAccounts(11, 'acc1', 'missing'), false);
    assert.equal(bank.mergeAccounts(12, 'missing', 'acc1'), false);
  });

  it('merged id cannot be created again', () => {
    bank.mergeAccounts(10, 'acc1', 'acc2');
    assert.equal(bank.createAccount(11, 'acc2'), false);
  });

  it('merge moves payments and their cashback', () => {
    assert.equal(bank.pay(5, 'acc2', 200), 'payment1'); // cashback = 4
    bank.mergeAccounts(10, 'acc1', 'acc2');
    assert.equal(bank.getPaymentStatus(11, 'acc1', 'payment1'), 'IN_PROGRESS');
    assert.equal(bank.getPaymentStatus(12, 'acc2', 'payment1'), null);
    assert.equal(bank.deposit(5 + DAY, 'acc1', 0), 1000 + 300 + 4);
    assert.equal(bank.getPaymentStatus(5 + DAY, 'acc1', 'payment1'), 'CASHBACK_RECEIVED');
  });

  it('getBalance: history', () => {
    bank.transfer(20, 'acc1', 'acc2', 300);
    assert.equal(bank.getBalance(30, 'acc1', 0), null); // before creation
    assert.equal(bank.getBalance(30, 'acc1', 1), 0);
    assert.equal(bank.getBalance(30, 'acc1', 3), 1000);
    assert.equal(bank.getBalance(30, 'acc1', 19), 1000);
    assert.equal(bank.getBalance(30, 'acc1', 20), 700);
    assert.equal(bank.getBalance(30, 'acc2', 25), 800);
    assert.equal(bank.getBalance(30, 'missing', 25), null);
  });

  it('getBalance: after merge', () => {
    bank.mergeAccounts(10, 'acc1', 'acc2');
    assert.equal(bank.getBalance(20, 'acc2', 9), 500); // before merge: still known
    assert.equal(bank.getBalance(20, 'acc2', 10), null); // merged away
    assert.equal(bank.getBalance(20, 'acc1', 9), 1000);
    assert.equal(bank.getBalance(20, 'acc1', 10), 1500);
  });

  it('getBalance: includes cashback at its own time', () => {
    bank.pay(5, 'acc1', 100); // cashback = 2 at 5 + DAY
    const later = 5 + 2 * DAY;
    assert.equal(bank.getBalance(later, 'acc1', 5 + DAY - 1), 900);
    assert.equal(bank.getBalance(later, 'acc1', 5 + DAY), 902);
  });
});
