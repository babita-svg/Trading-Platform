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

  const [tradeAction, setTradeAction] = useState(null); // { stock, type }
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [error, setError] = useState(null);

  // ── On mount: fetch market range to seed date/time selectors ──────────────
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

  // ── datetime derived value ─────────────────────────────────────────────────
  const datetime = currentDate && currentTime ? `${currentDate} ${currentTime}` : null;

  // ── Fetch stocks and portfolio whenever datetime changes ──────────────────
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

  // ── Trade handlers ─────────────────────────────────────────────────────────
  function handleOpenTrade(stock, type) {
    setTradeAction({ stock, type });
  }

  function handleTradeSuccess() {
    setTradeAction(null);
    refreshData();
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow mb-6">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Virtual Stock Trading Platform</h1>
          <span className="text-sm text-gray-400">Next.js Edition</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 pb-10">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>
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

        {/* Portfolio summary */}
        <PortfolioSummary portfolio={portfolio} />

        {/* Market table */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 text-gray-800">
            Live Prices
            {loadingMarket && <span className="ml-2 text-sm font-normal text-gray-400">Loading...</span>}
          </h2>
          <MarketTable stocks={stocks} onTrade={handleOpenTrade} />
        </div>

        {/* Transactions */}
        {transactions.length > 0 && (
          <div className="bg-white rounded shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datetime</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-500">{tx.id}</td>
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">{tx.symbol}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          tx.action === 'buy'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {tx.action.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-right">{tx.quantity}</td>
                      <td className="px-6 py-3 text-sm text-right">${tx.price?.toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm font-medium text-right">${tx.total?.toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{tx.datetime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
