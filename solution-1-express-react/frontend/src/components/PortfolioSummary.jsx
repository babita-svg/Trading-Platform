import React from 'react';

export default function PortfolioSummary({ portfolio }) {
  if (!portfolio) {
    return <div className="text-gray-500">Loading portfolio...</div>;
  }

  const { cash, totalValue, timestamp, holdings } = portfolio;
  const pl = totalValue - 100000; // Assuming 100k start
  const isProfit = pl >= 0;

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <h2 className="text-lg font-bold mb-4">Portfolio Summary</h2>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-sm text-gray-500">Cash Balance</div>
          <div className="text-xl font-bold">${cash?.toFixed(2)}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-sm text-gray-500">Total Value</div>
          <div className="text-xl font-bold">${totalValue?.toFixed(2)}</div>
        </div>
        <div className={`p-4 rounded ${isProfit ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="text-sm text-gray-500">Total P&L</div>
          <div className={`text-xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
            {isProfit ? '+' : '-'}${Math.abs(pl).toFixed(2)}
          </div>
        </div>
      </div>

      {holdings && Object.keys(holdings).length > 0 ? (
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-2 mt-4 uppercase">Current Holdings</h3>
          <ul className="divide-y divide-gray-100">
            {Object.entries(holdings).map(([symbol, h]) => (
              <li key={symbol} className="py-2 flex justify-between text-sm">
                <span className="font-medium">{symbol}</span>
                <span>{h.shares} shares @ ${(h.value / h.shares).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-sm text-gray-500 mt-2">No active holdings.</div>
      )}
    </div>
  );
}
