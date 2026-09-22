/**
 * api.js — all five REST endpoints in a single Express Router.
 *
 * Route handlers are intentionally thin: they validate HTTP-layer concerns
 * (presence of params, correct types) then delegate to data/service modules
 * for business logic.  Errors from the service layer carry a `.status` field
 * so we can forward the right HTTP code without hardcoding it here.
 */

import { Router } from 'express';
import {
  getPrice,
  getMarketRange,
  getKnownSymbols,
  getStockName,
} from '../data/market.js';
import {
  executeTrade,
  getPortfolioStatus,
  getTransactions,
} from '../services/portfolio.js';

const router = Router();

// ── GET /api/market/range ──────────────────────────────────────────────────

router.get('/market/range', (_req, res) => {
  res.json(getMarketRange());
});

// ── GET /api/stocks?datetime=YYYY-MM-DD HH:MM ─────────────────────────────

router.get('/stocks', (req, res) => {
  const { datetime } = req.query;

  if (!datetime) {
    return res.status(400).json({ message: 'datetime query param is required (YYYY-MM-DD HH:MM)' });
  }

  const symbols = getKnownSymbols();

  // Verify the datetime is valid by attempting a price lookup for one symbol.
  // If it returns null the datetime isn't in our dataset.
  const probe = getPrice(symbols[0], datetime);
  if (probe === null) {
    return res
      .status(400)
      .json({ message: `no market data found for datetime "${datetime}"` });
  }

  const stocks = symbols.map((symbol) => ({
    symbol,
    name: getStockName(symbol),
    price: getPrice(symbol, datetime),
  }));

  res.json({ datetime, stocks });
});

// ── GET /api/portfolio?datetime=YYYY-MM-DD HH:MM ──────────────────────────

router.get('/portfolio', (req, res) => {
  const { datetime } = req.query;

  if (!datetime) {
    return res.status(400).json({ message: 'datetime query param is required (YYYY-MM-DD HH:MM)' });
  }

  // Validate datetime before passing it to the portfolio service.
  const symbols = getKnownSymbols();
  const probe = getPrice(symbols[0], datetime);
  if (probe === null) {
    return res
      .status(400)
      .json({ message: `no market data found for datetime "${datetime}"` });
  }

  res.json(getPortfolioStatus(datetime));
});

// ── POST /api/trade ────────────────────────────────────────────────────────

router.post('/trade', (req, res) => {
  const { symbol, action, quantity, datetime } = req.body;

  // Presence checks — the service validates values, but missing fields need
  // a clear message before we even call it.
  const missing = ['symbol', 'action', 'quantity', 'datetime'].filter(
    (f) => req.body[f] === undefined || req.body[f] === null || req.body[f] === ''
  );
  if (missing.length > 0) {
    return res.status(400).json({ message: `missing required fields: ${missing.join(', ')}` });
  }

  // Coerce quantity to a number so the service's integer check works correctly
  // regardless of whether the client sent a string or a number.
  const qty = Number(quantity);

  try {
    const result = executeTrade(symbol, action, qty, datetime);
    res.status(201).json(result);
  } catch (err) {
    // Service throws { status, message } for known validation errors.
    const status = err.status ?? 500;
    const message = err.message ?? 'unexpected server error';
    res.status(status).json({ message });
  }
});

// ── GET /api/transactions ──────────────────────────────────────────────────

router.get('/transactions', (_req, res) => {
  res.json(getTransactions());
});

export default router;
