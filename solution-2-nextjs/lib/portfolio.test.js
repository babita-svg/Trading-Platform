import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadMarketData } from './market.js';
import {
  executeTrade,
  getPortfolioStatus,
  getPortfolioStateAtTime,
  getTransactions,
  resetPortfolio,
  STARTING_CASH,
} from './portfolio.js';

describe('Portfolio & Trade Business Logic', async () => {
  // Ensure market data is parsed before running tests
  await loadMarketData();

  beforeEach(() => {
    resetPortfolio();
  });

  test('1. valid buy order decreases cash and increases holdings', () => {
    const result = executeTrade('AAPL', 'buy', 10, '2024-01-15 09:30');
    assert.equal(result.transaction.symbol, 'AAPL');
    assert.equal(result.transaction.quantity, 10);
    assert.equal(result.transaction.action, 'buy');

    const status = getPortfolioStatus('2024-01-15 09:30');
    assert.equal(status.holdings.length, 1);
    assert.equal(status.holdings[0].symbol, 'AAPL');
    assert.equal(status.holdings[0].quantity, 10);
    assert.ok(status.cash < STARTING_CASH);
  });

  test('2. valid sell order increases cash and decreases holdings', () => {
    executeTrade('AAPL', 'buy', 10, '2024-01-15 09:30');
    const cashAfterBuy = getPortfolioStatus('2024-01-15 09:30').cash;

    executeTrade('AAPL', 'sell', 4, '2024-01-15 10:00');
    const status = getPortfolioStatus('2024-01-15 10:00');

    assert.equal(status.holdings.length, 1);
    assert.equal(status.holdings[0].quantity, 6);
    assert.ok(status.cash > cashAfterBuy);
  });

  test('3. buy fails when cash is insufficient', () => {
    assert.throws(
      () => executeTrade('NVDA', 'buy', 10000, '2024-01-15 09:30'),
      (err) => err.status === 400 && err.message.includes('insufficient cash')
    );
  });

  test('4. sell fails when selling more shares than owned', () => {
    executeTrade('AAPL', 'buy', 5, '2024-01-15 09:30');
    assert.throws(
      () => executeTrade('AAPL', 'sell', 10, '2024-01-15 10:00'),
      (err) => err.status === 400 && err.message.includes('cannot sell')
    );
  });

  test('5. trade fails on invalid stock symbol', () => {
    assert.throws(
      () => executeTrade('INVALID_XYZ', 'buy', 1, '2024-01-15 09:30'),
      (err) => err.status === 400 && err.message.includes('unknown symbol')
    );
  });

  test('6. trade fails on invalid action', () => {
    assert.throws(
      () => executeTrade('AAPL', 'hold', 1, '2024-01-15 09:30'),
      (err) => err.status === 400 && err.message.includes('action must be')
    );
  });

  test('7. trade fails on non-positive or non-integer quantity', () => {
    assert.throws(
      () => executeTrade('AAPL', 'buy', -5, '2024-01-15 09:30'),
      (err) => err.status === 400 && err.message.includes('positive integer')
    );
    assert.throws(
      () => executeTrade('AAPL', 'buy', 2.5, '2024-01-15 09:30'),
      (err) => err.status === 400 && err.message.includes('positive integer')
    );
  });

  test('8. trade fails on invalid or out-of-bounds datetime', () => {
    assert.throws(
      () => executeTrade('AAPL', 'buy', 1, '2024-01-01 00:00'),
      (err) => err.status === 400 && err.message.includes('no market data')
    );
  });

  test('9. historical portfolio time-travel reconstruction', () => {
    // Buy on Jan 15, then buy on Jan 20
    executeTrade('AAPL', 'buy', 10, '2024-01-15 09:30');
    executeTrade('MSFT', 'buy', 5, '2024-01-22 09:30');

    // Portfolio on Jan 15 must only show AAPL
    const jan15 = getPortfolioStatus('2024-01-15 09:30');
    assert.equal(jan15.holdings.length, 1);
    assert.equal(jan15.holdings[0].symbol, 'AAPL');

    // Portfolio on Jan 22 must show both AAPL and MSFT
    const jan22 = getPortfolioStatus('2024-01-22 09:30');
    assert.equal(jan22.holdings.length, 2);
  });

  test('10. backdated trades are rejected relative to latest execution', () => {
    executeTrade('AAPL', 'buy', 5, '2024-01-22 09:30');

    // Attempt to trade on earlier date Jan 15
    assert.throws(
      () => executeTrade('MSFT', 'buy', 5, '2024-01-15 09:30'),
      (err) => err.status === 400 && err.message.includes('cannot place a trade in the past')
    );
  });

  test('11. profit and loss calculation accurately reflects market value', () => {
    executeTrade('AAPL', 'buy', 10, '2024-01-15 09:30');
    const status = getPortfolioStatus('2024-01-15 09:30');

    assert.equal(typeof status.profitLoss, 'number');
    assert.equal(typeof status.profitLossPct, 'number');
    assert.equal(status.totalValue, parseFloat((status.cash + status.holdings[0].value).toFixed(2)));
    assert.equal(status.profitLoss, parseFloat((status.totalValue - STARTING_CASH).toFixed(2)));
  });

  test('12. transaction ordering returns newest first', () => {
    executeTrade('AAPL', 'buy', 2, '2024-01-15 09:30');
    executeTrade('MSFT', 'buy', 4, '2024-01-15 10:00');
    executeTrade('GOOGL', 'buy', 1, '2024-01-15 10:30');

    const txs = getTransactions();
    assert.equal(txs.length, 3);
    assert.equal(txs[0].symbol, 'GOOGL'); // latest first
    assert.equal(txs[1].symbol, 'MSFT');
    assert.equal(txs[2].symbol, 'AAPL');
  });
});
