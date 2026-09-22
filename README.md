# Virtual Stock Trading Platform

A browser-based virtual stock trading simulator built as a full-stack portfolio project. Trade 10 real-world stocks across 12 historical trading days using virtual money — no real transactions, no authentication required.

This repository contains **two independent implementations** of the same product, built to demonstrate different architectural approaches.

---

## Projects

| | Solution 1 | Solution 2 |
|--|--|--|
| **Stack** | React + Vite + Express | Next.js 14 (App Router) |
| **Backend** | Express.js on port 3001 | Next.js API Routes (built-in) |
| **Frontend** | Vite + React on port 5173 | Next.js on port 3000 |
| **Run** | Two terminals | One terminal |
| **Location** | `solution-1-express-react/` | `solution-2-nextjs/` |

---

## Features

- **Time-travel simulation** — Select any date and 30-minute interval across the trading period; prices and portfolio value update to reflect that moment.
- **Buy & sell stocks** — Trade 10 major stocks (AAPL, MSFT, GOOGL, AMZN, TSLA, NVDA, META, NFLX, AMD, INTC) with $100,000 in virtual cash.
- **Portfolio tracking** — See your current holdings, total value, and net profit/loss vs. your starting balance.
- **Transaction history** — Full record of every trade placed in the session.
- **No registration required** — Single predefined user, no login, no authentication.

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Solution 1 — React + Express

```bash
# Terminal 1: Start the backend API
cd solution-1-express-react/backend
npm install
npm start
# Backend running at http://localhost:3001
```

```bash
# Terminal 2: Start the React frontend
cd solution-1-express-react/frontend
npm install
npm run dev
# Frontend running at http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Solution 2 — Next.js

```bash
cd solution-2-nextjs
npm install
npm run dev
# App running at http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Market Data

Both solutions share a single CSV file at `data/market_data.csv`:

- **10 stocks** — AAPL, MSFT, GOOGL, AMZN, TSLA, NVDA, META, NFLX, AMD, INTC
- **12 trading days** — 2024-01-15 to 2024-01-30 (weekends excluded)
- **14 intervals/day** — 09:30 to 16:00 in 30-minute steps
- **1,680 total price points** — generated with a seeded random walk for reproducibility

To regenerate the CSV:

```bash
node data/generate_market_data.js
```

---

## API Reference (Solution 1 / Solution 2 share the same contract)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/market/range` | Available date/time range and trading days |
| `GET` | `/api/stocks?datetime=YYYY-MM-DD HH:MM` | All stock prices at a given time |
| `GET` | `/api/portfolio?datetime=YYYY-MM-DD HH:MM` | Portfolio value and holdings at a given time |
| `POST` | `/api/trade` | Execute a buy or sell order |
| `GET` | `/api/transactions` | Full transaction history (newest first) |

---

## Architecture Decision

**Why two implementations?**

Solution 1 demonstrates a **decoupled architecture**: a standalone Express API and a Vite React frontend that communicate over HTTP. This is the most common pattern in production — separate teams, separate deployments, clear API boundaries.

Solution 2 demonstrates a **Next.js monolith**: the API and the UI live in the same project. There is no separate backend process; API Routes in `app/api/` handle requests server-side, and React Client Components fetch from them. This reduces operational overhead (one process, one `npm run dev`) at the cost of tighter coupling.

Both share identical API contracts and business logic. The in-memory portfolio state resets on server restart in both — acceptable for an MVP without a persistent database.

---

## Project Structure

```
virtual-stock-platform/
├── data/
│   ├── generate_market_data.js   # CSV generation script (seeded PRNG)
│   └── market_data.csv           # 1,680 rows of simulated prices
├── solution-1-express-react/
│   ├── backend/
│   │   └── src/
│   │       ├── data/market.js        # CSV loader + price lookup
│   │       ├── services/portfolio.js # Trade logic + state
│   │       ├── routes/api.js         # Express route handlers
│   │       └── index.js              # Server entry point
│   └── frontend/
│       └── src/
│           ├── api/client.js         # Centralised fetch helpers
│           ├── components/           # TimeSelector, MarketTable, TradeModal, PortfolioSummary
│           └── App.jsx               # Root component + global state
└── solution-2-nextjs/
    ├── app/
    │   ├── api/                      # Next.js API route handlers
    │   └── page.js                   # Dashboard page (client component)
    ├── components/                   # Shared UI components
    └── lib/
        ├── market.js                 # CSV loader + price lookup
        └── portfolio.js              # Trade logic + state singleton
```

---

## Notes

- **State is in-memory** — portfolio data resets when the server restarts. This is intentional for the MVP scope.
- **No real money** — all trades use virtual cash starting at $100,000.
- **Reproducible data** — the CSV is generated with a seeded PRNG (mulberry32, seed 42), so the same prices appear on every machine.

<!-- Last updated for deployment -->
