# Virtual Stock Trading Platform — Design Specification

**Date:** 2026-09-21  
**Author:** Engineering  
**Status:** Approved

---

## 1. Overview

A browser-based virtual stock trading platform that lets a single predefined user
view simulated market data, buy and sell stocks using virtual money, and track
their portfolio's performance across a historical time window.

There is no real-money movement, no authentication, and no multi-user support.
The primary goal is to demonstrate a complete, well-structured full-stack application
suitable for an internship portfolio.

---

## 2. Repository Structure

The repository contains two independent, functionally equivalent implementations
of the same product:

```
virtual-stock-platform/
├── README.md                          # Root overview + links to each solution
├── data/
│   └── market_data.csv                # Shared CSV — used by both solutions
├── solution-1-express-react/          # Decoupled React + Express app
│   ├── backend/
│   │   ├── src/
│   │   │   ├── data/                  # CSV loader + in-memory store
│   │   │   ├── routes/                # Express route handlers
│   │   │   ├── services/              # Business logic (trades, portfolio)
│   │   │   └── index.js               # Server entry point
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── api/                   # All fetch() calls centralized here
│       │   ├── components/            # Reusable UI components
│       │   ├── pages/                 # Top-level route pages
│       │   ├── hooks/                 # Custom React hooks
│       │   └── main.jsx               # App entry point
│       └── package.json
└── solution-2-nextjs/                 # Next.js monolith
    ├── app/
    │   ├── api/                       # Next.js API route handlers
    │   └── (pages)/                   # React page components
    ├── lib/
    │   ├── market.js                  # CSV loading + price lookup
    │   ├── portfolio.js               # In-memory portfolio singleton
    │   └── trade.js                   # Trade validation + execution
    ├── components/                    # Shared UI components
    └── package.json
```

---

## 3. Market Data

### 3.1 CSV Format

```
symbol,date,time,price
AAPL,2024-01-15,09:30,185.20
AAPL,2024-01-15,10:00,186.45
...
```

- **10 stocks:** AAPL, MSFT, GOOGL, AMZN, TSLA, NVDA, META, NFLX, AMD, INTC
- **12 trading days:** 2024-01-15 through 2024-01-30 (excluding weekends)
- **Intervals:** 09:30 to 16:00, every 30 minutes = 14 intervals/day
- **Total rows:** 10 stocks × 12 days × 14 intervals = **1,680 data points**
- Prices are realistic ranges, with natural-looking drift and volatility per stock.

### 3.2 Loading Strategy

On server startup, the CSV is parsed once into a `Map<string, number>` keyed by
`"SYMBOL|YYYY-MM-DD|HH:MM"`. Price lookups are O(1). No database is needed.

---

## 4. Application State

All mutable state lives in memory on the server. It initialises on startup and
persists for the lifetime of the server process (resets on restart — acceptable
for an MVP).

```js
// Initial state
{
  cash: 100000.00,           // USD — the predefined user's starting balance
  holdings: {},              // { [symbol]: quantity }
  transactions: []           // Array of transaction records (see §6.3)
}
```

---

## 5. API Design

Both solutions expose identical API contracts (Express routes and Next.js API routes
are functionally equivalent).

### 5.1 `GET /api/stocks`

Returns prices for all 10 stocks at the requested simulated datetime.

**Query params:** `datetime` — ISO-like string `"YYYY-MM-DD HH:MM"`.  
**Response:**
```json
{
  "datetime": "2024-01-15 10:00",
  "stocks": [
    { "symbol": "AAPL", "name": "Apple Inc.", "price": 186.45 },
    { "symbol": "MSFT", "name": "Microsoft Corp.", "price": 374.20 }
  ]
}
```

**Error:** `400` if datetime is outside the available data range.

---

### 5.2 `GET /api/portfolio`

Returns the current portfolio state valued at the requested simulated datetime.

**Query params:** `datetime` — same format as above.  
**Response:**
```json
{
  "cash": 87432.50,
  "holdings": [
    { "symbol": "AAPL", "quantity": 10, "currentPrice": 186.45, "value": 1864.50 }
  ],
  "totalValue": 89297.00,
  "totalInvested": 88500.00,
  "profitLoss": 797.00,
  "profitLossPct": 0.90
}
```

---

### 5.3 `POST /api/trade`

Executes a buy or sell order at the price corresponding to the simulated datetime.

**Request body:**
```json
{
  "symbol": "AAPL",
  "action": "buy",
  "quantity": 5,
  "datetime": "2024-01-15 10:00"
}
```

**Validation (returns `400` with a descriptive message if violated):**
- `action` must be `"buy"` or `"sell"`.
- `quantity` must be a positive integer.
- `symbol` must be one of the 10 known stocks.
- `datetime` must map to an existing data point.
- `buy`: user must have sufficient cash.
- `sell`: user must own at least `quantity` shares.

**Success response (`201`):**
```json
{
  "transaction": {
    "id": "txn_001",
    "symbol": "AAPL",
    "action": "buy",
    "quantity": 5,
    "price": 186.45,
    "total": 932.25,
    "datetime": "2024-01-15 10:00",
    "executedAt": "2026-09-21T10:34:00.000Z"
  },
  "newCash": 99067.75
}
```

---

### 5.4 `GET /api/transactions`

Returns the complete transaction history, newest first.

**Response:** Array of transaction objects (same shape as `§5.3` response).

---

### 5.5 `GET /api/market/range`

Returns the available date/time range so the frontend can constrain the time picker.

**Response:**
```json
{
  "start": "2024-01-15 09:30",
  "end": "2024-01-30 16:00",
  "tradingDays": ["2024-01-15", "2024-01-16", ...]
}
```

---

## 6. Frontend Design

### 6.1 Pages / Views

| Route | Description |
|-------|-------------|
| `/` | Dashboard — time selector + stock market table + portfolio summary |
| `/portfolio` | Detailed holdings, P&L breakdown, total value chart |
| `/transactions` | Full transaction history table |

### 6.2 Global Time Selector

- A date picker (constrained to available trading days) + a time dropdown
  (09:30–16:00 in 30-min steps).
- Lives in the top navigation bar, persists across page navigation.
- On change, refetches stock prices and portfolio value for the new time.
- Defaults to the **latest** available data point on first load.

### 6.3 Market Table (Dashboard)

Columns: Symbol | Company | Price at Selected Time | Change from Open | Action

- "Change from Open" shows the delta from 09:30 on the selected day.
- Buy/Sell buttons open a quantity input inline or in a small modal.
- Price cells use green/red colouring for up/down movement.

### 6.4 Portfolio Summary (Dashboard)

- Cash available, total portfolio value, net P&L (dollar + %) vs starting $100,000.
- A compact holdings table: Symbol | Qty | Avg Buy Price | Current Price | Value | P&L.

### 6.5 Transaction History

- Sortable table: Date/Time | Symbol | Action | Qty | Price | Total.
- Buy rows styled green, sell rows styled red.

---

## 7. Tech Stack

| Layer | Solution 1 | Solution 2 |
|-------|-----------|-----------|
| Frontend framework | React 18 + Vite | Next.js 14 (App Router) |
| UI styling | Tailwind CSS | Tailwind CSS |
| State management | React Context + hooks | React Context + hooks |
| HTTP client | native `fetch` | native `fetch` |
| Backend | Express 4 | Next.js API Routes |
| CSV parsing | `csv-parse` | `csv-parse` |
| In-memory state | Module-level singleton | Module-level singleton |
| Linting | ESLint + Prettier | ESLint + Prettier |

No database. No authentication library. No Redux. No UI component library
(Tailwind is sufficient and shows you understand CSS fundamentals).

---

## 8. Code Quality Standards

These apply to every file in the project:

1. **Comments explain why, not what.** A comment on a sorting function explains
   the business reason, not that it sorts.
2. **No dead code.** No commented-out blocks, no unused imports.
3. **Error paths are first-class.** Every API route returns a structured error
   response; the frontend displays it to the user, not `console.error`.
4. **Functions have one responsibility.** Price lookup is separate from trade
   validation, which is separate from state mutation.
5. **No magic numbers.** `STARTING_CASH = 100_000` not `100000` scattered
   throughout.
6. **Consistent naming:** camelCase for variables/functions, PascalCase for
   components/classes, UPPER_SNAKE for constants.

---

## 9. Git Commit Convention

All commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add portfolio P&L calculation endpoint
fix: handle missing datetime param in /api/stocks
chore: add ESLint and Prettier config
docs: add README setup instructions
```

Branch strategy: `main` is always deployable. Feature work on short-lived branches
merged via PR with a one-line description.

---

## 10. README Structure (Root)

```markdown
# Virtual Stock Trading Platform

A simulated stock market built as a full-stack portfolio project.
...

## Projects

| | Solution 1 | Solution 2 |
|--|--|--|
| Stack | React + Express | Next.js |
| Run | two terminals | one terminal |

## Getting Started

...

## Architecture Decision

Why two implementations? ...
```

---

## 11. Out of Scope

- User authentication / registration
- Real-money transactions
- Persistent database (SQLite, PostgreSQL, etc.)
- Real-time price updates (WebSocket / SSE)
- Order types beyond market orders (limit, stop-loss)
- Mobile-specific layout optimisation

---

## 12. Success Criteria

The project is complete when:

- [ ] CSV data covers 10 stocks, 12 days, 30-min intervals.
- [ ] Both solutions run from a single `npm install && npm run dev`.
- [ ] All five API endpoints return correct data.
- [ ] A user can buy and sell stock; cash and holdings update immediately.
- [ ] The time selector changes visible prices and portfolio value.
- [ ] Transaction history is complete and persistent within a session.
- [ ] ESLint passes with zero warnings.
- [ ] Root README explains both solutions clearly.
