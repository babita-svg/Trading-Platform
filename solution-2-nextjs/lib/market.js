/**
 * market.js — loads the CSV dataset once into an in-memory lookup map.
 *
 * Uses Node's built-in file system to parse standard CSV rows without third-party dependencies.
 * Composite string key "SYMBOL|YYYY-MM-DD|HH:MM" provides O(1) price lookups.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function resolveCsvPath() {
  const localPath = resolve(process.cwd(), 'data', 'market_data.csv');
  if (existsSync(localPath)) return localPath;
  const parentPath = resolve(process.cwd(), '..', 'data', 'market_data.csv');
  if (existsSync(parentPath)) return parentPath;
  return localPath;
}

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

let priceMap = new Map();
let tradingDays = [];
let rangeStart = null;
let rangeEnd = null;
let loaded = false;

export function loadMarketData() {
  if (loaded) return Promise.resolve();

  try {
    const csvPath = resolveCsvPath();
    const content = readFileSync(csvPath, 'utf8');
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

    const daySet = new Set();

    // Skip header line at index 0: symbol,date,time,price
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length >= 4) {
        const [symbol, date, time, priceStr] = parts;
        const price = parseFloat(priceStr);
        if (!isNaN(price)) {
          const key = `${symbol}|${date}|${time}`;
          priceMap.set(key, price);
          daySet.add(date);
        }
      }
    }

    tradingDays = [...daySet].sort();
    if (tradingDays.length > 0) {
      rangeStart = `${tradingDays[0]} 09:30`;
      rangeEnd = `${tradingDays[tradingDays.length - 1]} 16:00`;
    }

    loaded = true;
    return Promise.resolve();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function getPrice(symbol, datetime) {
  if (!datetime || typeof datetime !== 'string' || !datetime.includes(' ')) {
    return null;
  }
  const [date, time] = datetime.split(' ');
  const key = `${symbol}|${date}|${time}`;
  const price = priceMap.get(key);
  return price !== undefined ? price : null;
}

export function getOpenPrice(symbol, datetime) {
  if (!datetime || typeof datetime !== 'string' || !datetime.includes(' ')) {
    return null;
  }
  const [date] = datetime.split(' ');
  const key = `${symbol}|${date}|09:30`;
  const price = priceMap.get(key);
  return price !== undefined ? price : null;
}

export function getMarketRange() {
  return { start: rangeStart, end: rangeEnd, tradingDays };
}

export function getKnownSymbols() {
  return Object.keys(STOCK_NAMES);
}

export function getStockName(symbol) {
  return STOCK_NAMES[symbol] ?? null;
}
