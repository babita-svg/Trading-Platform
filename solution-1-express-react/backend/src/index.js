/**
 * index.js — Express server entry point.
 *
 * We load the CSV before opening the port so the first request never hits
 * an empty price map.  Any startup failure (e.g. CSV missing) exits the
 * process with a non-zero code rather than silently serving empty data.
 */

import express from 'express';
import cors from 'cors';
import { loadMarketData } from './data/market.js';
import apiRouter from './routes/api.js';

const PORT = 3001;

// Allow requests from the Vite dev server.  In production both services
// would sit behind the same origin, but during development they run on
// separate ports so an explicit CORS origin is required.
const FRONTEND_ORIGIN = 'http://localhost:5173';

async function start() {
  await loadMarketData();

  const app = express();

  app.use(cors({ origin: FRONTEND_ORIGIN }));
  app.use(express.json());

  app.use('/api', apiRouter);

  app.listen(PORT, () => {
    console.log(`vsp-backend listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
