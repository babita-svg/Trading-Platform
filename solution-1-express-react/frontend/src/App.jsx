import React, { useState, useEffect } from 'react';
import { getMarketRange, getStocks, getPortfolio } from './api/client';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tradeAction, setTradeAction] = useState(null);

  // Initialize market range on load
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

  // Fetch stocks and portfolio when datetime changes
  const fetchData = async () => {
    if (!datetime) return;
    setLoading(true);
    setError(null);
    try {
      const [stocksData, portfolioData] = await Promise.all([
        getStocks(datetime),
        getPortfolio(datetime)
      ]);
      setStocks(stocksData.stocks);
      setPortfolio(portfolioData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datetime]);

  const handleTradeSuccess = () => {
    setTradeAction(null);
    fetchData(); // Refresh portfolio and potentially stock prices if changed
  };

  if (!range && !error) {
    return <div className="p-8 text-center text-gray-500">Connecting to Virtual Market...</div>;
  }

  return (
    <div className="min-h-screen pt-8 pb-12 px-4 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Virtual Stock Platform</h1>
        <p className="text-gray-500">Backtesting simulation environment</p>
      </header>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {range && (
        <TimeSelector
          currentDate={currentDate}
          currentTime={currentTime}
          setCurrentDate={setCurrentDate}
          setCurrentTime={setCurrentTime}
          tradingDays={range.tradingDays}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Market Data</h2>
          <MarketTable
            stocks={stocks}
            onTrade={(stock, type) => setTradeAction({ stock, type })}
          />
        </div>

        <div>
          <PortfolioSummary portfolio={portfolio} />
        </div>
      </div>

      <TradeModal
        tradeAction={tradeAction}
        datetime={datetime}
        onClose={() => setTradeAction(null)}
        onSuccess={handleTradeSuccess}
      />
    </div>
  );
}

export default App;
