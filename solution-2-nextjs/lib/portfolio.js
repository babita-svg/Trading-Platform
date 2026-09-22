/**
 * portfolio.js — module-level singleton owning all mutable trading state.
 *
 * Module scope means Next.js API routes share the same object across requests
 * without a database. State resets on server restart (or hot-reload in dev).
 * This is intentional for the MVP; document it clearly to users.
 */

import { getPrice, getKnownSymbols } from './market.js';

const STARTING_CASH = 100_000;

// ── Mutable singleton state ──────────────────────────────────────────────────

let cash = STARTING_CASH;

// { [symbol]: quantity } — absent keys mean zero holdings.
const holdings = {};

// Ordered oldest-first; GET /api/transactions reverses before responding.
const transactions = [];

// ── Helpers ──────────────────────────────────────────────────────────────────

function nextTxnId() {
  const seq = String(transactions.length + 1).padStart(3, '0');
  return `txn_${seq}`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Validates and executes a buy or sell order.
 * Throws { status, message } for validation errors so route handlers can
 * forward the correct HTTP status without coupling this module to Next.js.
 */
export function executeTrade(symbol, action, quantity, datetime) {
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
    const owned = holdings[symbol] ?? 0;
    if (owned < quantity) {
      throw {
        status: 400,
        message: `cannot sell ${quantity} shares of ${symbol}; you own ${owned}`,
      };
    }
    cash = parseFloat((cash + total).toFixed(2));
    holdings[symbol] = owned - quantity;
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
 */
export function getPortfolioStatus(datetime) {
  const holdingsList = Object.entries(holdings)
    .filter(([, qty]) => qty > 0)
    .map(([symbol, quantity]) => {
      const currentPrice = getPrice(symbol, datetime);
      const value =
        currentPrice !== null ? parseFloat((quantity * currentPrice).toFixed(2)) : 0;
      return { symbol, quantity, currentPrice, value };
    });

  const holdingsMarketValue = holdingsList.reduce((sum, h) => sum + h.value, 0);
  const totalValue = parseFloat((cash + holdingsMarketValue).toFixed(2));
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
