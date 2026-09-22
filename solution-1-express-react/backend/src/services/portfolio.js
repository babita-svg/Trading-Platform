/**
 * portfolio.js — module-level singleton that owns all mutable trading state.
 *
 * Keeping state at module scope means Express routes share the same object
 * across requests without needing a database or external cache.  The trade-off
 * is that the state resets on server restart, which is acceptable for an MVP.
 */

import { getPrice, getKnownSymbols } from '../data/market.js';

// Starting balance matches the product spec.  Defined here rather than
// imported from the generator so this module has no cross-solution coupling.
const STARTING_CASH = 100_000;

// ── Mutable state ──────────────────────────────────────────────────────────

let cash = STARTING_CASH;

// { [symbol]: quantity }  — symbols absent from the object mean zero holdings.
const holdings = {};

// Ordered oldest-first internally; the GET /api/transactions route reverses
// before responding so callers always receive newest-first.
const transactions = [];

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Generates a zero-padded transaction ID like "txn_001".
 * Simple sequence is fine for an in-memory store with no persistence.
 */
function nextTxnId() {
  const seq = String(transactions.length + 1).padStart(3, '0');
  return `txn_${seq}`;
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Validates and executes a buy or sell order.
 *
 * Throws an object { status, message } so the route layer can forward the
 * right HTTP status code without coupling this function to Express.
 *
 * @param {string} symbol
 * @param {'buy'|'sell'} action
 * @param {number} quantity  — must be a positive integer
 * @param {string} datetime  — "YYYY-MM-DD HH:MM"
 * @returns {object} { transaction, newCash }
 */
export function executeTrade(symbol, action, quantity, datetime) {
  // ── Input validation (order matters: cheapest checks first) ──────────────

  if (action !== 'buy' && action !== 'sell') {
    throw { status: 400, message: `action must be "buy" or "sell", got "${action}"` };
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw { status: 400, message: 'quantity must be a positive integer' };
  }

  const knownSymbols = getKnownSymbols();
  if (!knownSymbols.includes(symbol)) {
    throw {
      status: 400,
      message: `unknown symbol "${symbol}"; valid symbols are ${knownSymbols.join(', ')}`,
    };
  }

  const price = getPrice(symbol, datetime);
  if (price === null) {
    throw {
      status: 400,
      message: `no data for ${symbol} at "${datetime}"; check that the datetime is within a trading session`,
    };
  }

  const total = parseFloat((price * quantity).toFixed(2));

  // ── Business-rule validation ──────────────────────────────────────────────

  if (action === 'buy') {
    if (cash < total) {
      throw {
        status: 400,
        message: `insufficient cash: need $${total.toFixed(2)}, have $${cash.toFixed(2)}`,
      };
    }
    cash = parseFloat((cash - total).toFixed(2));
    holdings[symbol] = (holdings[symbol] ?? 0) + quantity;
  } else {
    // sell
    const owned = holdings[symbol] ?? 0;
    if (owned < quantity) {
      throw {
        status: 400,
        message: `cannot sell ${quantity} shares of ${symbol}; you own ${owned}`,
      };
    }
    cash = parseFloat((cash + total).toFixed(2));
    holdings[symbol] = owned - quantity;
    // Remove the key entirely when the position is closed so the holdings
    // object doesn't accumulate zero-quantity entries.
    if (holdings[symbol] === 0) delete holdings[symbol];
  }

  const transaction = {
    id: nextTxnId(),
    symbol,
    action,
    quantity,
    price,
    total,
    datetime,
    executedAt: new Date().toISOString(),
  };

  transactions.push(transaction);

  return { transaction, newCash: cash };
}

/**
 * Returns a snapshot of the portfolio valued at the given datetime.
 *
 * @param {string} datetime  — "YYYY-MM-DD HH:MM"
 * @returns {object}
 */
export function getPortfolioStatus(datetime) {
  const holdingsList = Object.entries(holdings)
    .filter(([, qty]) => qty > 0)
    .map(([symbol, quantity]) => {
      const currentPrice = getPrice(symbol, datetime);
      // currentPrice may be null if a bad datetime is passed — the route layer
      // validates datetime before calling here, so null is unexpected but we
      // handle it gracefully to avoid NaN in calculations.
      const value =
        currentPrice !== null ? parseFloat((quantity * currentPrice).toFixed(2)) : 0;
      return { symbol, quantity, currentPrice, value };
    });

  const holdingsMarketValue = holdingsList.reduce((sum, h) => sum + h.value, 0);
  const totalValue = parseFloat((cash + holdingsMarketValue).toFixed(2));

  // totalInvested represents how much of the starting cash has been deployed,
  // not how much was paid for current holdings (i.e. it ignores sell proceeds).
  const totalInvested = parseFloat((STARTING_CASH - cash).toFixed(2));

  const profitLoss = parseFloat((totalValue - STARTING_CASH).toFixed(2));
  const profitLossPct = parseFloat(((profitLoss / STARTING_CASH) * 100).toFixed(2));

  return {
    cash,
    holdings: holdingsList,
    totalValue,
    totalInvested,
    profitLoss,
    profitLossPct,
  };
}

/**
 * Returns the full transaction list, newest first.
 */
export function getTransactions() {
  return [...transactions].reverse();
}
