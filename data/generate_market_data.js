'use strict';

/**
 * generate_market_data.js
 *
 * Generates a reproducible CSV of simulated intraday stock prices for 10 tickers
 * over 12 trading days. Uses a seeded PRNG (mulberry32) so every run produces
 * identical output — critical for deterministic backtesting and unit tests.
 *
 * Output: data/market_data.csv  (columns: symbol,date,time,price)
 */

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STARTING_CASH = 100_000; // kept here so other modules can import this file as config

const TICKERS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
  'NVDA', 'META', 'NFLX', 'AMD',  'INTC',
];

// Realistic base prices as of early 2024 (mid-January range)
const BASE_PRICES = {
  AAPL:  185,
  MSFT:  370,
  GOOGL: 140,
  AMZN:  155,
  TSLA:  220,
  NVDA:  495,
  META:  380,
  NFLX:  490,
  AMD:   145,
  INTC:   44,
};

// Trading window: 09:30 – 16:00, one tick every 30 minutes
const MARKET_OPEN_HOUR   = 9;
const MARKET_OPEN_MINUTE = 30;
const MARKET_CLOSE_HOUR  = 16;
const MARKET_CLOSE_MINUTE = 0;
const INTERVAL_MINUTES   = 30;

// Date range: 2024-01-15 (Mon) through 2024-01-30 (Tue) — 12 business days
const RANGE_START = new Date('2024-01-15T00:00:00Z');
const RANGE_END   = new Date('2024-01-30T00:00:00Z');

// Random-walk parameters
// Daily drift keeps prices slowly trending; per-interval volatility adds noise.
const DAILY_DRIFT_PCT      = 0.001;  // 0.1 % expected daily move
const INTERVAL_VOLATILITY  = 0.003;  // 0.3 % std-dev per 30-min interval
const PRNG_SEED            = 42;     // fixed seed for full reproducibility

const OUTPUT_PATH = path.join(__dirname, 'market_data.csv');

// ---------------------------------------------------------------------------
// Seeded PRNG — mulberry32 (public domain, George Marsaglia lineage)
// Returns a float in [0, 1) each call; state is advanced in place.
// ---------------------------------------------------------------------------

function makePRNG(seed) {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
}

// Box-Muller transform: converts two uniform samples into a standard-normal sample.
// We use this to produce realistic Gaussian price shocks rather than uniform noise.
function makeNormal(rand) {
  return function () {
    const u1 = rand();
    const u2 = rand();
    // Clamp u1 away from zero to avoid log(0)
    const safe = u1 < 1e-10 ? 1e-10 : u1;
    return Math.sqrt(-2 * Math.log(safe)) * Math.cos(2 * Math.PI * u2);
  };
}

// ---------------------------------------------------------------------------
// Business-day calendar helpers
// ---------------------------------------------------------------------------

function isWeekend(date) {
  const day = date.getUTCDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
}

/** Returns an array of Date objects for each business day in [start, end] (UTC). */
function getBusinessDays(start, end) {
  const days = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    if (!isWeekend(cursor)) {
      days.push(new Date(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

// ---------------------------------------------------------------------------
// Trading-interval helpers
// ---------------------------------------------------------------------------

/** Returns an array of "HH:MM" strings for every 30-min slot in the trading window. */
function getTradingIntervals() {
  const slots = [];
  let h = MARKET_OPEN_HOUR;
  let m = MARKET_OPEN_MINUTE;
  while (h < MARKET_CLOSE_HOUR || (h === MARKET_CLOSE_HOUR && m <= MARKET_CLOSE_MINUTE)) {
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += INTERVAL_MINUTES;
    if (m >= 60) { h += 1; m -= 60; }
  }
  return slots;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const rand   = makePRNG(PRNG_SEED);
  const normal = makeNormal(rand);

  const businessDays = getBusinessDays(RANGE_START, RANGE_END);
  const timeSlots    = getTradingIntervals();

  // Build CSV rows: header first, then one row per (symbol × day × interval)
  const rows = ['symbol,date,time,price'];

  for (const ticker of TICKERS) {
    // Each ticker starts at its base price and walks forward through all intervals
    let price = BASE_PRICES[ticker];

    for (const day of businessDays) {
      const dateStr = day.toISOString().slice(0, 10); // "YYYY-MM-DD"

      // Apply a small daily drift before the first interval of each day
      price *= 1 + DAILY_DRIFT_PCT * (normal() > 0 ? 1 : -1);

      for (const time of timeSlots) {
        // Geometric random walk: price can never go negative
        const shock = normal() * INTERVAL_VOLATILITY;
        price *= 1 + shock;

        // Guard: price must stay positive (should never trigger with realistic params)
        if (price <= 0) price = 0.01;

        rows.push(`${ticker},${dateStr},${time},${price.toFixed(2)}`);
      }
    }
  }

  // Write CSV — synchronous write is fine for a one-shot generation script
  fs.writeFileSync(OUTPUT_PATH, rows.join('\n') + '\n', 'utf8');

  // Summary for the operator
  const dataRowCount = rows.length - 1; // subtract header
  const dates = businessDays.map(d => d.toISOString().slice(0, 10));
  console.log('--- Market Data Generation Summary ---');
  console.log(`Output file  : ${OUTPUT_PATH}`);
  console.log(`Stocks       : ${TICKERS.join(', ')}`);
  console.log(`Trading days : ${businessDays.length}  (${dates[0]} → ${dates[dates.length - 1]})`);
  console.log(`Intervals/day: ${timeSlots.length}  (${timeSlots[0]} – ${timeSlots[timeSlots.length - 1]})`);
  console.log(`Data rows    : ${dataRowCount}  (expected: ${TICKERS.length} × ${businessDays.length} × ${timeSlots.length} = ${TICKERS.length * businessDays.length * timeSlots.length})`);
  console.log('--------------------------------------');
}

main();
