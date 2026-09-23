import React from 'react';

/**
 * Displays portfolio KPIs and current holdings.
 * Expects the portfolio shape returned by GET /api/portfolio:
 * { cash, holdings: [{symbol, quantity, currentPrice, value}], totalValue, profitLoss, profitLossPct }
 */
export default function PortfolioSummary({ portfolio }) {
  if (!portfolio) {
    return <div className="text-gray-500 py-4">Loading portfolio...</div>;
  }

  const { cash, totalValue, holdings, profitLoss, profitLossPct, costBasis } = portfolio;
  const isProfit = profitLoss >= 0;

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <h2 className="text-lg font-bold mb-4">Portfolio Summary</h2>

      <div className="grid grid-cols-1 gap-3 mb-4">
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Cash Available</div>
          <div className="text-xl font-bold">${cash?.toFixed(2)}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Portfolio Value</div>
          <div className="text-xl font-bold">${totalValue?.toFixed(2)}</div>
        </div>
        <div className={`p-3 rounded ${isProfit ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Net P&L vs $100,000</div>
          <div className={`text-xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
            {isProfit ? '+' : ''}${profitLoss?.toFixed(2)}
          </div>
          <div className={`text-sm ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
            {isProfit ? '+' : ''}{profitLossPct?.toFixed(2)}%
          </div>
        </div>
        {costBasis > 0 && (
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Cost Basis (open positions)</div>
            <div className="text-base font-semibold">${costBasis?.toFixed(2)}</div>
          </div>
        )}
      </div>

      {holdings && holdings.length > 0 ? (
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 mt-4">
            Holdings at Selected Time
          </h3>
          <ul className="divide-y divide-gray-100">
            {holdings.map((h) => (
              <li key={h.symbol} className="py-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-gray-900">{h.symbol}</span>
                  <span className="font-medium">${h.value?.toFixed(2)}</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {h.quantity} shares @ ${h.currentPrice?.toFixed(2) ?? 'N/A'}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-sm text-gray-400 mt-2">No holdings at this time.</div>
      )}
    </div>
  );
}
