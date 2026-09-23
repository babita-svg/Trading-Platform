/**
 * portfolio.js — module-level singleton owning all mutable trading state.
 *
 * Module scope means Express routes share the same object across requests
 * without a database. State resets on server restart (acceptable for MVP).
 */

import { getPrice, getKnownSymbols } from '../data/market.js';

const STARTING_CASH = 100_000;

// ── Mutable state ──────────────────────────────────────────────────────────

// Ordered oldest-first internally; the GET /api/transactions route reverses
// before responding so callers always receive newest-first.
const transactions = [];

// ── Helpers ────────────────────────────────────────────────────────────────

function nextTxnId() {
  const seq = String(transactions.length + 1).padStart(3, '0');
  return `txn_${seq}`;
}

/**
 * Reconstructs portfolio state from transactions up to a given datetime.
 * This ensures time-travel works correctly: the portfolio at time T shows
 * only the effects of trades executed at or before T.
 */
function getPortfolioStateAtTime(datetime) {
  let cash = STARTING_CASH;
  const holdings = {};

  // Filter transactions to only those executed at or before the given datetime
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

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Validates and executes a buy or sell order.
 *
 * Throws an object { status, message } so the route layer can forward the
 * right HTTP status code without coupling this function to Express.
 */
export function executeTrade(symbol, action, quantity, datetime) {
  // Validate input types first
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

  // Check if trying to trade in the past relative to existing trades
  const latestTradeTime = transactions.length > 0
    ? transactions[transactions.length - 1].datetime
    : null;

  if (latestTradeTime && datetime < latestTradeTime) {
    throw {
      status: 400,
      message: `cannot trade in the past: latest trade was at ${latestTradeTime}, requested ${datetime}`
    };
  }

  const total = parseFloat((price * quantity).toFixed(2));

  // Get current state at the trading datetime to validate the trade
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

  // Return the new cash balance after this trade
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
      const value = currentPrice !== null ? parseFloat((quantity * currentPrice).toFixed(2)) : 0;
      return { symbol, quantity, currentPrice, value };
    });

  const holdingsMarketValue = holdingsList.reduce((sum, h) => sum + h.value, 0);
  const totalValue = parseFloat((cash + holdingsMarketValue).toFixed(2));

  // Calculate cost basis of current holdings, not total deployed capital
  const costBasis = Object.entries(holdings)
    .filter(([, qty]) => qty > 0)
    .reduce((sum, [symbol, quantity]) => {
      const buys = transactions
        .filter(tx => tx.symbol === symbol && tx.action === 'buy' && tx.datetime <= datetime)
        .reduce((total, tx) => total + tx.total, 0);
      const sells = transactions
        .filter(tx => tx.symbol === symbol && tx.action === 'sell' && tx.datetime <= datetime)
        .reduce((total, tx) => total + tx.total, 0);
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