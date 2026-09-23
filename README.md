# Virtual Stock Trading Platform

A browser-based simulated stock market platform built with Next.js (App Router). Trade 10 real-world stocks across 12 simulated market days using virtual money — with deterministic market data, historical time-travel backtesting, dynamic portfolio tracking, and complete transaction logs.

---

## Key Features

- **Time-Travel Simulation** — Select any historical trading day and 30-minute interval across the 12-day dataset (09:30 to 16:00 EST). All stock prices, portfolio value, and open holdings dynamically reconstruct to reflect that exact moment.
- **Chronological Trade Integrity** — Backdating prevention ensures trades can only be placed at or after the timestamp of your latest executed trade.
- **Virtual Trading** — Buy and sell 10 major US equities (AAPL, MSFT, GOOGL, AMZN, TSLA, NVDA, META, NFLX, AMD, INTC) starting with $100,000 in virtual cash.
- **Dynamic Portfolio & P&L** — Instant calculation of cash balance, open positions, total portfolio market value, and net profit/loss ($ and %).
- **Simulated Day Change Indicators** — Real-time price movement percentage displayed against the day's market open (09:30 EST).
- **Session Transaction History** — Comprehensive audit log of every buy and sell order executed in the session.
- **Zero Real Money & Zero Auth** — Designed strictly as a single-user simulation environment; no login or payment credentials needed.

---

## Technology Stack

- **Framework:** Next.js 16 (App Router)
- **UI & Components:** React 19, Tailwind CSS v4
- **Runtime:** Node.js 20.9+ (ES Modules)
- **Testing:** Node.js native test runner (`node --test`)
- **Data:** In-memory dataset parsed via Node built-in file streams (zero external CSV parsing dependencies)

---

## Quick Start

### Prerequisites

- Node.js **20.9** or later
- npm 9 or later

### Running the Application

```bash
# 1. Navigate to the Next.js project directory
cd solution-2-nextjs

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Running Automated Tests

The application includes a suite of 12 unit tests validating all core trade execution, validation rules, time-travel portfolio reconstruction, and P&L calculations:

```bash
cd solution-2-nextjs
npm test
```

---

## Architecture & Design Decisions

### Why Next.js App Router & API Routes?
Next.js provides a unified full-stack architecture where React Client Components communicate with server-side API Routes (`app/api/*`) within the same deployment unit. This eliminates the need for separate backend infrastructure, CORS configuration, or multiple terminal windows during local evaluation.

### Why In-Memory State?
Per assignment guidelines, the application targets a single predefined user for MVP demonstration. An in-memory singleton manages trading state without introducing external database dependencies (PostgreSQL, SQLite, Redis), ensuring zero-configuration evaluation and lightning-fast state operations.

### Historical Portfolio Reconstruction (Time-Travel)
When a user selects simulated timestamp $T$:
1. The system filters the transaction log for orders where $\text{datetime} \le T$.
2. Cash balance and share holdings are deterministically replayed up to $T$.
3. Total portfolio market value is computed using the stock prices at timestamp $T$.
4. Net Profit/Loss is calculated against the initial $\$100,000$ base.

> **Note on State Persistence:** As this is an in-memory simulation, trading state is maintained for the lifecycle of the server process and resets upon server restart.

---

## Market Data Specifications

The dataset represents simulated trading for 10 liquid stocks over 12 consecutive business weekdays (excluding weekends):

- **Date Range:** 2024-01-15 through 2024-01-30 (12 weekdays)
- **Trading Hours:** 09:30 to 16:00 EST in 30-minute steps (14 intervals/day)
- **Total Data Points:** $10 \text{ stocks} \times 12 \text{ days} \times 14 \text{ intervals} = 1,680 \text{ price rows}$
- **Deterministic Generation:** Generated using a seeded `mulberry32` PRNG (seed 42) and geometric random walk with realistic volatility. Output is 100% reproducible.

### Regenerating Market Data

```bash
node data/generate_market_data.js
```

This single command updates both the root dataset and the application dataset simultaneously.

---

## API Reference

All endpoints return standard JSON responses and structured error messages with appropriate HTTP status codes.

| Method | Endpoint | Description | Query / Body Params |
|---|---|---|---|
| `GET` | `/api/market/range` | Available date range and trading days | None |
| `GET` | `/api/stocks` | All stock prices and day change at given time | `datetime=YYYY-MM-DD HH:MM` |
| `GET` | `/api/portfolio` | Reconstructed portfolio and P&L at given time | `datetime=YYYY-MM-DD HH:MM` |
| `POST` | `/api/trade` | Execute a buy or sell order | `{"symbol", "action", "quantity", "datetime"}` |
| `GET` | `/api/transactions` | Full session trade audit log (newest first) | None |

### Trade Validation Rules
The `/api/trade` endpoint strictly validates:
- `action` is `"buy"` or `"sell"`.
- `quantity` is a positive integer.
- `symbol` is one of the 10 supported tickers.
- `datetime` maps to an existing simulated market slot.
- `buy` checks available virtual cash $\ge \text{quantity} \times \text{price}$.
- `sell` checks owned shares $\ge \text{quantity}$.
- Backdated orders ($\text{datetime} < \text{latest trade time}$) are rejected with `400 Bad Request`.

---

## Project Structure

```
Trading-Platform/
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated CI pipeline (lint, test, build)
├── data/
│   ├── generate_market_data.js  # Deterministic PRNG data generator
│   └── market_data.csv          # 1,680 rows of simulated market prices
├── solution-2-nextjs/
│   ├── app/
│   │   ├── api/                 # Next.js API route handlers
│   │   │   ├── market/range/    # Available range endpoint
│   │   │   ├── portfolio/       # Historical portfolio endpoint
│   │   │   ├── stocks/          # Stock price & day change endpoint
│   │   │   ├── trade/           # Trade execution & validation endpoint
│   │   │   └── transactions/    # Audit log endpoint
│   │   ├── globals.css          # Tailwind CSS styles
│   │   ├── layout.js            # Root HTML layout & font setup
│   │   └── page.js              # Main trading dashboard page
│   ├── components/
│   │   ├── MarketTable.jsx      # Stock list with prices & buy/sell actions
│   │   ├── PortfolioSummary.jsx # Cash, total value, P&L & holdings
│   │   ├── TimeSelector.jsx     # Simulated market timestamp picker
│   │   └── TradeModal.jsx       # Order configuration & validation modal
│   ├── data/
│   │   └── market_data.csv      # Application market dataset
│   ├── lib/
│   │   ├── market.js            # O(1) CSV memory lookup loader
│   │   ├── portfolio.js         # In-memory trade execution & time-travel logic
│   │   └── portfolio.test.js    # 12 automated unit tests (node:test)
│   ├── package.json             # Scripts & dependency definitions
│   └── next.config.mjs          # Next.js build configuration
└── README.md                    # Project documentation & evaluation guide
```
