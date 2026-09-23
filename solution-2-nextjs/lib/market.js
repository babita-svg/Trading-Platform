/**
 * market.js — loads the shared CSV once at startup into a fast lookup map.
 *
 * In Next.js, this module is imported by API route handlers. The module-level
 * singleton means the data is parsed once per process and shared across all
 * requests. During `next dev`, hot-reload may reset the state — this is
 * expected and documented.
 *
 * Key design: composite string key "SYMBOL|YYYY-MM-DD|HH:MM" for O(1) lookups.
 */

import { createReadStream } from 'fs';
import { resolve, join } from 'path';
import { parse } from 'csv-parse';

// Safe resolution for deployment to Vercel/Next.js hosting:
// Rely on process.cwd() pointing to solution-2-nextjs root, where we now keep a local copy
const CSV_PATH = resolve(process.cwd(), 'data', 'market_data.csv');

// The 10 known stocks with human-readable names.
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

// Sorted unique dates present in the CSV.
let tradingDays = [];

// Earliest and latest datetime strings in the data.
let rangeStart = null;
let rangeEnd = null;

// Track whether loading has started so we only parse once.
let loadPromise = null;

/**
 * Parses the CSV once. Subsequent calls return the same promise.
 */
export function loadMarketData() {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((res, rej) => {
    const daySet = new Set();

    createReadStream(CSV_PATH)
      .pipe(parse({ columns: true, trim: true }))
      .on('data', (row) => {
        const key = `${row.symbol}|${row.date}|${row.time}`;
        priceMap.set(key, parseFloat(row.price));
        daySet.add(row.date);
      })
      .on('end', () => {
        tradingDays = [...daySet].sort();
        rangeStart = `${tradingDays[0]} 09:30`;
        rangeEnd = `${tradingDays[tradingDays.length - 1]} 16:00`;
        res();
      })
      .on('error', rej);
  });

  return loadPromise;
}

/**
 * Returns the price for a symbol at a datetime string ("YYYY-MM-DD HH:MM"),
 * or null when the data point doesn't exist.
 */
export function getPrice(symbol, datetime) {
  const [date, time] = datetime.split(' ');
  const key = `${symbol}|${date}|${time}`;
  const price = priceMap.get(key);
  return price !== undefined ? price : null;
}

/**
 * Returns market range metadata for GET /api/market/range.
 */
export function getMarketRange() {
  return { start: rangeStart, end: rangeEnd, tradingDays };
}

/**
 * Returns all known symbol strings.
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
