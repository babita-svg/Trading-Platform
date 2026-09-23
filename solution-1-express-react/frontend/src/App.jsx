import React, { useState, useEffect, useCallback } from 'react';
import { getMarketRange, getStocks, getPortfolio, getTransactions } from './api/client';

import TimeSelector from './components/TimeSelector';
import PortfolioSummary from './components/PortfolioSummary';
import MarketTable from './components/MarketTable';
import TradeModal from './components/TradeModal';

function App() {
  const [range, setRange] = useState(null);
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('09:30');

  const [stocks, setStocks] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tradeAction, setTradeAction] = useState(null);

  // Load the available date/time range once on mount
  useEffect(() => {
    getMarketRange()
      .then((data) => {
        setRange(data);
        if (data.tradingDays.length > 0) {
          setCurrentDate(data.tradingDays[0]);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  const datetime = currentDate ? `${currentDate} ${currentTime}` : '';

  // Re-fetch prices, portfolio and transactions whenever the selected time changes
  const refreshData = useCallback(async () => {
    if (!datetime) return;
    setLoading(true);
    setError(null);
    try {
      const [stocksData, portfolioData, txData] = await Promise.all([
        getStocks(datetime),
        getPortfolio(datetime),
        getTransactions(),
      ]);
      setStocks(stocksData.stocks);
      setPortfolio(portfolioData);
      setTransactions(txData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [datetime]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleTradeSuccess = () => {
    setTradeAction(null);
    refreshData();
  };

  if (!range && !error) {
    return <div className="p-8 text-center text-gray-500">Connecting to Virtual Market...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow mb-6">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Virtual Stock Trading Platform</h1>
            <p className="text-sm text-gray-400">React + Express Edition</p>
          </div>
          {loading && <span className="text-sm text-gray-400">Loading...</span>}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 pb-10">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Time selector */}
        {range && (
          <TimeSelector
            currentDate={currentDate}
            currentTime={currentTime}
            setCurrentDate={setCurrentDate}
            setCurrentTime={setCurrentTime}
            tradingDays={range.tradingDays}
          />
        )}

        {/* Main grid: market table + portfolio */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Live Prices</h2>
            </div>
            <MarketTable
              stocks={stocks}
              onTrade={(stock, type) => setTradeAction({ stock, type })}
            />
          </div>

          <div>
            <PortfolioSummary portfolio={portfolio} />
          </div>
        </div>

        {/* Transaction history */}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sim. Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-400">{tx.id}</td>
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
    </div>
  );
}

export default App;
