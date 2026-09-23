"use client";

import { useState, useEffect, useCallback } from 'react';
import TimeSelector from '@/components/TimeSelector';
import MarketTable from '@/components/MarketTable';
import TradeModal from '@/components/TradeModal';
import PortfolioSummary from '@/components/PortfolioSummary';

export default function DashboardPage() {
  const [tradingDays, setTradingDays] = useState([]);
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('09:30');

  const [stocks, setStocks] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [tradeAction, setTradeAction] = useState(null);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/market/range')
      .then((r) => r.json())
      .then((data) => {
        setTradingDays(data.tradingDays ?? []);
        if (data.tradingDays?.length > 0) {
          setCurrentDate(data.tradingDays[0]);
        }
      })
      .catch(() => setError('Failed to load market range.'));
  }, []);

  const datetime = currentDate && currentTime ? `${currentDate} ${currentTime}` : null;

  const refreshData = useCallback(async () => {
    if (!datetime) return;
    setLoadingMarket(true);
    setError(null);
    try {
      const [stocksRes, portfolioRes, txRes] = await Promise.all([
        fetch(`/api/stocks?datetime=${encodeURIComponent(datetime)}`),
        fetch(`/api/portfolio?datetime=${encodeURIComponent(datetime)}`),
        fetch('/api/transactions'),
      ]);

      if (stocksRes.ok) {
        const d = await stocksRes.json();
        setStocks(d.stocks ?? []);
      }
      if (portfolioRes.ok) {
        setPortfolio(await portfolioRes.json());
      }
      if (txRes.ok) {
        setTransactions(await txRes.json());
      }
    } catch {
      setError('Failed to fetch market data.');
    } finally {
      setLoadingMarket(false);
    }
  }, [datetime]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  function handleOpenTrade(stock, type) {
    setTradeAction({ stock, type });
  }

  function handleTradeSuccess() {
    setTradeAction(null);
    refreshData();
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Top Banner & Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">Virtual Stock Trading Platform</h1>
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">
                Simulation Only
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic 12-day market backtesting environment — No real money or transactions involved
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Initial Balance</span>
            <span className="text-sm font-bold text-slate-700">$100,000.00 USD</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-lg mb-6 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 font-bold ml-4">✕</button>
          </div>
        )}

        {/* Time selector */}
        {tradingDays.length > 0 && (
          <TimeSelector
            currentDate={currentDate}
            currentTime={currentTime}
            setCurrentDate={setCurrentDate}
            setCurrentTime={setCurrentTime}
            tradingDays={tradingDays}
          />
        )}

        {/* Main Grid: Market Prices & Portfolio Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900">
                Simulated Market Prices
              </h2>
              {loadingMarket && (
                <span className="text-xs text-slate-400 font-medium">Fetching prices...</span>
              )}
            </div>
            <MarketTable stocks={stocks} onTrade={handleOpenTrade} />
          </div>

          <div>
            <PortfolioSummary portfolio={portfolio} />
          </div>
        </div>

        {/* Transactions / Session Trades */}
        <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">All Session Trades</h2>
              <p className="text-xs text-slate-400 mt-0.5">Complete record of orders executed in this session</p>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {transactions.length} {transactions.length === 1 ? 'Trade' : 'Trades'}
            </span>
          </div>

          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Order ID</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Symbol</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Action</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Quantity</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Execution Price</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Total Value</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Simulated Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 text-xs font-mono text-slate-400">{tx.id}</td>
                      <td className="px-5 py-3 text-sm font-bold text-slate-900">{tx.symbol}</td>
                      <td className="px-5 py-3 text-xs">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                          tx.action === 'buy'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {tx.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-right font-medium text-slate-800">{tx.quantity}</td>
                      <td className="px-5 py-3 text-sm text-right text-slate-700">${tx.price?.toFixed(2)}</td>
                      <td className="px-5 py-3 text-sm font-bold text-slate-900 text-right">${tx.total?.toFixed(2)}</td>
                      <td className="px-5 py-3 text-xs font-mono text-slate-500">{tx.datetime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-400">
              No trades executed yet. Pick a stock and click Buy to place your first trade.
            </div>
          )}
        </div>
      </div>

      {/* Trade modal */}
      {tradeAction && (
        <TradeModal
          tradeAction={tradeAction}
          datetime={datetime}
          onClose={() => setTradeAction(null)}
          onSuccess={handleTradeSuccess}
        />
      )}
    </main>
  );
}
