/**
 * portfolio.js — module-level state managing virtual portfolio holdings and trades.
 *
 * In-memory singleton stores executed transactions. State is dynamically reconstructed
 * for any requested datetime T to ensure time-travel historical consistency:
 * only trades placed at or before T affect the cash, holdings, and portfolio value at T.
 */

import { getPrice, getKnownSymbols } from './market.js';

export const STARTING_CASH = 100_000;

// Internal transaction log: ordered oldest to newest.
let transactions = [];

/**
 * Resets portfolio state. Used by tests to ensure clean execution.
 */
export function resetPortfolio() {
  transactions = [];
}

function nextTxnId() {
  const seq = String(transactions.length + 1).padStart(3, '0');
  return `txn_${seq}`;
}

/**
 * Reconstructs cash balance and holdings for any given timestamp T.
 * Only processes transactions where tx.datetime <= T.
 */
export function getPortfolioStateAtTime(datetime) {
  let cash = STARTING_CASH;
  const holdings = {};

  const relevantTransactions = transactions.filter((tx) => tx.datetime <= datetime);

  for (const tx of relevantTransactions) {
    const { symbol, action, quantity, total } = tx;

    if (action === 'buy') {
      cash = parseFloat((cash - total).toFixed(2));
      holdings[symbol] = (holdings[symbol] ?? 0) + quantity;
    } else if (action === 'sell') {
      cash = parseFloat((cash + total).toFixed(2));
      holdings[symbol] = (holdings[symbol] ?? 0) - quantity;
      if (holdings[symbol] <= 0) {
        delete holdings[symbol];
      }
    }
  }

  return { cash, holdings };
}

/**
 * Validates and executes a buy or sell order.
 * Throws an error object { status, message } for route handlers to return.
 */
export function executeTrade(symbol, action, quantity, datetime) {
  if (!symbol || typeof symbol !== 'string') {
    throw { status: 400, message: 'symbol must be a valid non-empty string' };
  }

  if (action !== 'buy' && action !== 'sell') {
    throw { status: 400, message: `action must be "buy" or "sell", got "${action}"` };
  }

  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
    throw { status: 400, message: 'quantity must be a positive integer' };
  }

  if (!datetime || typeof datetime !== 'string' || !datetime.includes(' ')) {
    throw { status: 400, message: 'datetime must be a valid string in "YYYY-MM-DD HH:MM" format' };
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
      message: `no market data for ${symbol} at "${datetime}"; ensure date and time are within market hours`,
    };
  }

  // Prevent backdating trades: Cannot place a trade earlier than the latest executed trade
  if (transactions.length > 0) {
    const latestTradeTime = transactions[transactions.length - 1].datetime;
    if (datetime < latestTradeTime) {
      throw {
        status: 400,
        message: `cannot place a trade in the past: latest trade was at ${latestTradeTime}, requested ${datetime}`,
      };
    }
  }

  const total = parseFloat((price * quantity).toFixed(2));
  const { cash, holdings } = getPortfolioStateAtTime(datetime);

  if (action === 'buy') {
    if (cash < total) {
      throw {
        status: 400,
        message: `insufficient cash: order requires $${total.toFixed(2)}, available cash is $${cash.toFixed(2)}`,
      };
    }
  } else {
    const owned = holdings[symbol] ?? 0;
    if (owned < quantity) {
      throw {
        status: 400,
        message: `cannot sell ${quantity} shares of ${symbol}; you only hold ${owned} shares at this time`,
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

  const updatedState = getPortfolioStateAtTime(datetime);
  return { transaction, newCash: updatedState.cash };
}

/**
 * Returns a complete portfolio snapshot valued at the given simulated datetime.
 */
export function getPortfolioStatus(datetime) {
  if (!datetime || typeof datetime !== 'string') {
    throw { status: 400, message: 'datetime query parameter is required' };
  }

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
  const profitLoss = parseFloat((totalValue - STARTING_CASH).toFixed(2));
  const profitLossPct = parseFloat(((profitLoss / STARTING_CASH) * 100).toFixed(2));

  return {
    cash,
    holdings: holdingsList,
    totalValue,
    profitLoss,
    profitLossPct,
  };
}

/**
 * Returns all executed transactions in reverse chronological order (newest first).
 */
export function getTransactions() {
  return [...transactions].reverse();
}
