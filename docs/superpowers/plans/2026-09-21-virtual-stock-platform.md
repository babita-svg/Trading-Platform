# Virtual Stock Trading Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Virtual Stock Trading Platform featuring a manual simulated-time selector, a memory-backed portfolio tracker, and two completely separated architectures (React+Express and Next.js monolith).

**Architecture:** 
1. A node script to generate 1,680 rows of 30-min interval dummy stock data.
2. Solution 1: Node/Express backend that keeps state in memory, combined with a Vite/React frontend using plain CSS/Tailwind.
3. Solution 2: Next.js App Router application implementing the exact same API contract via API routes and keeping state in a global singleton.

**Tech Stack:** 
- Node.js (raw filesystem/HTTP APIs), Express 4
- React 18, Vite
- Next.js 14
- Tailwind CSS layer for both

**Spec:** `docs/superpowers/specs/2026-09-21-virtual-stock-platform-design.md`

## Global Constraints
- Absolute paths only.
- Strict directory separation (`/data`, `/solution-1-express-react`, `/solution-2-nextjs`).
- Use in-memory data structures (Singleton/Module pattern) for stock state — no DB setup.
- Error paths form actual JSON responses (`400 Bad Request` with descriptive message), no silent swallowing.
- No actual trading, no real-money logic, no auth. Cash always starts at 100000.00.

---

### Task 1: Generate Market Data CSV

**Files:**
- Create: `data/generate_market_data.js`
- Create: `data/market_data.csv` (by running the script)

**Interfaces:**
- Produces: `market_data.csv` with columns: `symbol,date,time,price`

- [ ] **Step 1: Write the generation script**
  Create `data/generate_market_data.js`. It should pick 10 tickers, iterate 12 business days (2024-01-15 to 2024-01-30 skipping weekends), and generate prices every 30 minutes between 09:30 and 16:00 using a random walk. Write to `data/market_data.csv`.
- [ ] **Step 2: Run the script**
  Run `node data/generate_market_data.js` to ensure the CSV is properly generated and populated with exactly 1680 rows.
- [ ] **Step 3: Commit**
  `git add data/` and `git commit -m "feat: generate 12 days of 30-min interval dummy stock data"`

---

### Task 2: Scaffold Solution 1 (Express Backend)

**Files:**
- Create: `solution-1-express-react/backend/package.json`
- Create: `solution-1-express-react/backend/src/data/market.js`
- Create: `solution-1-express-react/backend/src/services/portfolio.js`
- Create: `solution-1-express-react/backend/src/routes/api.js`
- Create: `solution-1-express-react/backend/src/index.js`

**Interfaces:**
- Consumes: `../../data/market_data.csv`
- Produces: API responding on `http://localhost:3001/api/stocks?datetime=Y-M-D H:M`, `POST /api/trade`, `GET /api/portfolio`, `GET /api/market/range`

- [ ] **Step 1: Init backend**
  Create `solution-1-express-react/backend/package.json`. Install dependencies: `express`, `csv-parse`, `cors`.
- [ ] **Step 2: Implement CSV loading (`data/market.js`)**
  Export `loadMarketData()` and `getPrice(symbol, datetime)`. Ensure the CSV parses dates (`YYYY-MM-DD`) and times (`HH:MM`) correctly.
- [ ] **Step 3: Implement Portfolio logic (`services/portfolio.js`)**
  Keep a module-level variable tracking `cash`, `holdings`, `transactions`. Implement `executeTrade(symbol, action, quantity, datetime)` throwing descriptive errors if invalid, and `getPortfolioStatus(datetime)`.
- [ ] **Step 4: Wire routing & server (`routes/api.js` & `index.js`)**
  Export GET/POST endpoints matching the spec in §5. Boot Express on `.listen(3001)`.
- [ ] **Step 5: Test the routes**
  Run the server, parse the CSV, test `GET /api/stocks?datetime=2024-01-15 09:30` via `curl`.
- [ ] **Step 6: Commit**

---

### Task 3: Scaffold Solution 1 (React Frontend)

**Files:**
- Create: `solution-1-express-react/frontend/package.json` (Vite)
- Create: `solution-1-express-react/frontend/src/api/client.js`
- Create: `solution-1-express-react/frontend/src/App.jsx`
- Create: `solution-1-express-react/frontend/src/components/` (TimeSelector, MarketTable, PortfolioSummary, TradeModal)

**Interfaces:**
- Consumes: Backend running on port 3001.

- [ ] **Step 1: Init frontend**
  Run `npm create vite@latest solution-1-express-react/frontend -- --template react`. Install `tailwindcss postcss autoprefixer` and initialize standard tailwind config.
- [ ] **Step 2: Write API Client**
  In `api/client.js`, wrap `fetch` calls to `http://localhost:3001/api/...` for cleanliness.
- [ ] **Step 3: Build Top-Layer Layout & Time Selector**
  In `App.jsx`, implement a global state for `datetime`. Build a `<TimeSelector />` constrained by `/api/market/range`.
- [ ] **Step 4: Build MarketTable & TradeModal**
  Present the 10 stocks. Tying a Buy/Sell click to state opens a modal to execute trade via `POST /api/trade`. Refresh portfolio data on success.
- [ ] **Step 5: Build PortfolioSummary**
  Display `cash`, `holdings` value, and `P&L` dynamically based on the globally selected time.
- [ ] **Step 6: Ensure everything connects**
  Start backend and frontend. Place one trade locally. Ensure it reflects.
- [ ] **Step 7: Commit**

---

### Task 4: Scaffold Solution 2 (Next.js Monolith)

**Files:**
- Create: `solution-2-nextjs/` (Next.js App Router tree)
- Create: `solution-2-nextjs/app/api/.../route.js`
- Create: `solution-2-nextjs/lib/` (market, portfolio)

**Interfaces:**
- Produces: An identical interface structure, unified in a monorepo approach with `/api` routes serving React components.

- [ ] **Step 1: Init Next.js**
  Run `npx create-next-app@latest solution-2-nextjs --use-npm --no-tailwind --no-eslint --app --src-dir --import-alias '@/*' --javascript`. We will configure tailwind manually or let it run. Let's just use defaults to map effectively but use plain CSS or tailwind based on default. Let's actually use standard Tailwind in it.
- [ ] **Step 2: Port backend state to Next.js API (`lib/`)**
  Copy `market.js` and `portfolio.js` logic. Ensure it works within Next.js API routes (`NextResponse.json`). *Note: The singleton persists during `npm run dev` but might reset on hot-reload - document this.*
- [ ] **Step 3: Build Next.js API Routes**
  Create `app/api/stocks/route.js`, `app/api/portfolio/route.js`, `app/api/trade/route.js`, copying route validation logic.
- [ ] **Step 4: Port React components to Next.js Client Pages**
  Copy `TimeSelector`, `MarketTable`, `TradeModal`, `PortfolioSummary` into Next's `app/page.js` as client components (`"use client"`). Adapt imports.
- [ ] **Step 5: Validate build and functionality**
  Run `npm run dev` on port 3002. Select a time. Perform a trade.
- [ ] **Step 6: Commit**

---

### Task 5: Final Polish & README

**Files:**
- Create: `README.md` (root level)

- [ ] **Step 1: Write root README**
  Detail how to start Solution 1 and Solution 2 concurrently. Add an "Architecture Decision" section outlining why the decoupling of Express/Vite differs from Next.js, fulfilling the spec.
- [ ] **Step 2: Commit**

---
