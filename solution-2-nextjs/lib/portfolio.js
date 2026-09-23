/**
 * portfolio.js — module-level singleton owning all mutable trading state.
 *
 * Module scope means Next.js API routes share the same object across requests
 * without a database. State resets on server restart (or hot-reload in dev).
 * This is intentional for the MVP — document it clearly.
 */

import { getPrice, getKnownSymbols } from './market.js';

const STARTING_CASH = 100_000;

// ── Mutable singleton state ──────────────────────────────────────────────────

// Ordered oldest-first; GET /api/transactions reverses before responding.
const transactions = [];

// ── Helpers ──────────────────────────────────────────────────────────────────

function nextTxnId() {
  const seq = String(transactions.length + 1).padStart(3, '0');
  return `txn_${seq}`;
}

/**
 * Reconstructs portfolio state from transactions up to a given datetime.
 * This ensures time-travel is historically accurate: the portfolio at time T
 * reflects only trades executed at or before T, not all trades ever made.
 */
function getPortfolioStateAtTime(datetime) {
  let cash = STARTING_CASH;
  const holdings = {};

  const relevantTransactions = transactions.filter(tx => tx.datetime <= datetime);

  for (const tx of relevantTransactions) {
    const { symbol, action, quantity, total } = tx;

    if (action === 'buy') {
      cash = parseFloat((cash - total).toFixed(2));
      holdings[symbol] = (holdings[symbol] ?? 0) + quantity;
    } else {
      cash = parseFloat((cash + total).toFixed(2));
      holdings[symbol] = (holdings[symbol] ?? 0) - quantity;
      if (holdings[symbol] === 0) delete holdings[symbol];
    }
  }

  return { cash, holdings };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Validates and executes a buy or sell order.
 * Throws { status, message } for validation errors so route handlers can
 * forward the correct HTTP status without coupling this module to Next.js.
 */
export function executeTrade(symbol, action, quantity, datetime) {
  // Validate input types before business logic
  if (typeof symbol !== 'string' || symbol.trim() === '') {
    throw { status: 400, message: 'symbol must be a non-empty string' };
  }

  if (typeof datetime !== 'string' || !datetime.includes(' ')) {
    throw { status: 400, message: 'datetime must be a string in format "YYYY-MM-DD HH:MM"' };
  }

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

  // Prevent trading in the past relative to existing trades
  const latestTradeTime = transactions.length > 0
    ? transactions[transactions.length - 1].datetime
    : null;

  if (latestTradeTime && datetime < latestTradeTime) {
    throw {
      status: 400,
      message: `cannot trade in the past: latest trade was at ${latestTradeTime}, requested ${datetime}`,
    };
  }

  const total = parseFloat((price * quantity).toFixed(2));

  // Reconstruct state at this datetime to validate the trade
  const { cash, holdings } = getPortfolioStateAtTime(datetime);

  if (action === 'buy') {
    if (cash < total) {
      throw {
        status: 400,
        message: `insufficient cash: need $${total.toFixed(2)}, have $${cash.toFixed(2)}`,
      };
    }
  } else {
    const owned = holdings[symbol] ?? 0;
    if (owned < quantity) {
      throw {
        status: 400,
        message: `cannot sell ${quantity} shares of ${symbol}; you own ${owned}`,
      };
    }
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

  const newState = getPortfolioStateAtTime(datetime);
  return { transaction, newCash: newState.cash };
}

/**
 * Returns a snapshot of the portfolio valued at the given datetime.
 * Only includes transactions executed at or before that time.
 */
export function getPortfolioStatus(datetime) {
  const { cash, holdings } = getPortfolioStateAtTime(datetime);

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

  // Cost basis: what was paid net for currently held shares
  const costBasis = Object.entries(holdings)
    .filter(([, qty]) => qty > 0)
    .reduce((sum, [symbol]) => {
      const buys = transactions
        .filter(tx => tx.symbol === symbol && tx.action === 'buy' && tx.datetime <= datetime)
        .reduce((acc, tx) => acc + tx.total, 0);
      const sells = transactions
        .filter(tx => tx.symbol === symbol && tx.action === 'sell' && tx.datetime <= datetime)
        .reduce((acc, tx) => acc + tx.total, 0);
      return sum + Math.max(0, buys - sells);
    }, 0);

  const profitLoss = parseFloat((totalValue - STARTING_CASH).toFixed(2));
  const profitLossPct = parseFloat(((profitLoss / STARTING_CASH) * 100).toFixed(2));

  return {
    cash,
    holdings: holdingsList,
    totalValue,
    costBasis: parseFloat(costBasis.toFixed(2)),
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