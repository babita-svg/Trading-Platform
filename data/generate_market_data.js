/**
 * generate_market_data.js — generates deterministic dummy market data for 10 stocks.
 *
 * Uses a seeded mulberry32 PRNG (seed 42) so output is 100% reproducible across environments.
 * Generates 10 stocks x 12 simulated weekdays x 14 intervals (30-min steps from 09:30 to 16:00)
 * = exactly 1,680 data rows.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PRNG_SEED = 42;

function createPRNG(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createPRNG(PRNG_SEED);

function randomGaussian(mean = 0, stdev = 1) {
  let u = 0;
  let v = 0;
  while (u === 0) u = random();
  while (v === 0) v = random();
  return mean + stdev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

const STOCKS = [
  { symbol: 'AAPL', basePrice: 185.0 },
  { symbol: 'MSFT', basePrice: 370.0 },
  { symbol: 'GOOGL', basePrice: 140.0 },
  { symbol: 'AMZN', basePrice: 155.0 },
  { symbol: 'TSLA', basePrice: 220.0 },
  { symbol: 'NVDA', basePrice: 495.0 },
  { symbol: 'META', basePrice: 380.0 },
  { symbol: 'NFLX', basePrice: 490.0 },
  { symbol: 'AMD', basePrice: 145.0 },
  { symbol: 'INTC', basePrice: 44.0 },
];

function generateSimulatedDates() {
  const dates = [];
  const start = new Date(Date.UTC(2024, 0, 15)); // Monday Jan 15
  const end = new Date(Date.UTC(2024, 0, 30));   // Tuesday Jan 30

  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getUTCDay();
    // Skip Saturdays (6) and Sundays (0)
    if (day !== 0 && day !== 6) {
      dates.push(cur.toISOString().slice(0, 10));
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

function generateIntervals() {
  const intervals = [];
  for (let h = 9; h <= 16; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 9 && m < 30) continue;
      if (h === 16 && m > 0) continue;
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      intervals.push(`${hh}:${mm}`);
    }
  }
  return intervals;
}

export function generateCSV() {
  const dates = generateSimulatedDates();
  const intervals = generateIntervals();
  const rows = ['symbol,date,time,price'];

  for (const stock of STOCKS) {
    let price = stock.basePrice;

    for (const date of dates) {
      for (const time of intervals) {
        // Geometric random walk: price = price * exp(drift + vol * Z)
        const shock = randomGaussian(0.0001, 0.0035);
        price = Math.max(1.0, price * Math.exp(shock));
        const formattedPrice = price.toFixed(2);
        rows.push(`${stock.symbol},${date},${time},${formattedPrice}`);
      }
    }
  }

  return rows.join('\n') + '\n';
}

function main() {
  const csvContent = generateCSV();
  const rootCsvPath = resolve(__dirname, 'market_data.csv');
  const solutionCsvPath = resolve(__dirname, '..', 'solution-2-nextjs', 'data', 'market_data.csv');

  try {
    writeFileSync(rootCsvPath, csvContent, 'utf8');
    console.log(`Generated root CSV: ${rootCsvPath}`);

    const solutionDataDir = dirname(solutionCsvPath);
    if (!existsSync(solutionDataDir)) {
      mkdirSync(solutionDataDir, { recursive: true });
    }
    writeFileSync(solutionCsvPath, csvContent, 'utf8');
    console.log(`Generated Next.js CSV: ${solutionCsvPath}`);

    console.log(`Summary: 10 stocks, 12 days, 14 intervals/day = 1,680 data points.`);
  } catch (err) {
    console.error('Error writing CSV:', err);
    process.exit(1);
  }
}

main();
