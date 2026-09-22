/**
 * market.js — loads the shared CSV once at startup into a fast lookup map.
 *
 * Key design: we parse dates/times from the CSV into a composite string key
 * "SYMBOL|YYYY-MM-DD|HH:MM" so price lookups are O(1) — no scanning needed
 * during request handling.
 */

import { createReadStream } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';

// Navigate from src/data/ up to the repo root, then into the shared data folder.
const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = resolve(__dirname, '../../../../data/market_data.csv');

// The 10 known stocks, with human-readable names for API responses.
const STOCK_NAMES = {
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft Corp.',
  GOOGL: 'Alphabet Inc.',
  AMZN: 'Amazon.com Inc.',
  TSLA: 'Tesla Inc.',
  NVDA: 'NVIDIA Corp.',
  META: 'Meta Platforms Inc.',
  NFLX: 'Netflix Inc.',
  AMD: 'Advanced Micro Devices Inc.',
  INTC: 'Intel Corp.',
};

// priceMap: "SYMBOL|YYYY-MM-DD|HH:MM" → price (number)
let priceMap = new Map();

// Sorted unique dates ("YYYY-MM-DD") present in the CSV.
let tradingDays = [];

// Earliest and latest datetime strings in the data, used for range responses.
let rangeStart = null;
let rangeEnd = null;

/**
 * Parses the CSV on startup.  Returns a promise so index.js can await it
 * before opening the HTTP port — we must not accept requests against a cold
 * store.
 */
export function loadMarketData() {
  return new Promise((resolve, reject) => {
    const daySet = new Set();

    createReadStream(CSV_PATH)
      .pipe(parse({ columns: true, trim: true }))
      .on('data', (row) => {
        const key = `${row.symbol}|${row.date}|${row.time}`;
        priceMap.set(key, parseFloat(row.price));
        daySet.add(row.date);
      })
      .on('end', () => {
        // Sort trading days chronologically so range responses are correct.
        tradingDays = [...daySet].sort();

        // Range spans the first open to the last close across all symbols.
        rangeStart = `${tradingDays[0]} 09:30`;
        rangeEnd = `${tradingDays[tradingDays.length - 1]} 16:00`;

        resolve();
      })
      .on('error', reject);
  });
}

/**
 * Returns the price for a given symbol at a given datetime string
 * ("YYYY-MM-DD HH:MM"), or null when the data point doesn't exist.
 *
 * Returning null rather than throwing keeps validation logic in the route
 * layer, which owns the HTTP response contract.
 */
export function getPrice(symbol, datetime) {
  const [date, time] = datetime.split(' ');
  const key = `${symbol}|${date}|${time}`;
  const price = priceMap.get(key);
  return price !== undefined ? price : null;
}

/**
 * Returns the full market range metadata needed by GET /api/market/range.
 */
export function getMarketRange() {
  return { start: rangeStart, end: rangeEnd, tradingDays };
}

/**
 * Returns all symbols as an array — used for O(1) membership checks
 * without importing the constant object into every route.
 */
export function getKnownSymbols() {
  return Object.keys(STOCK_NAMES);
}

/**
 * Returns the human-readable name for a symbol, or null if unknown.
 */
export function getStockName(symbol) {
  return STOCK_NAMES[symbol] ?? null;
}
