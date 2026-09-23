"use client";

import React from 'react';

export default function PortfolioSummary({ portfolio }) {
  if (!portfolio) {
    return <div className="text-gray-500 py-6 text-center bg-white rounded-lg shadow">Loading portfolio...</div>;
  }

  const { cash, totalValue, holdings, profitLoss, profitLossPct } = portfolio;
  const isProfit = profitLoss >= 0;

  return (
    <div className="bg-white p-5 rounded-lg shadow border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900 tracking-tight">Portfolio Overview</h2>
        <span className="text-xs text-gray-400 font-medium">Starting: $100,000.00</span>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-5">
        <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-100">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Available Virtual Cash</div>
          <div className="text-2xl font-bold text-gray-900 mt-0.5">${cash?.toFixed(2)}</div>
        </div>

        <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-100">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Portfolio Value</div>
          <div className="text-2xl font-bold text-gray-900 mt-0.5">${totalValue?.toFixed(2)}</div>
        </div>

        <div className={`p-3.5 rounded-lg border ${isProfit ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'}`}>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Net Profit / Loss</div>
          <div className={`text-2xl font-bold mt-0.5 ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
            {isProfit ? '+' : ''}${profitLoss?.toFixed(2)}
          </div>
          <div className={`text-xs font-semibold mt-0.5 ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isProfit ? '+' : ''}{profitLossPct?.toFixed(2)}% vs initial balance
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
          Holdings at Selected Time
        </h3>
        {holdings && holdings.length > 0 ? (
          <ul className="divide-y divide-gray-100 border-t border-b border-gray-100">
            {holdings.map((h) => (
              <li key={h.symbol} className="py-2.5 flex justify-between items-center text-sm">
                <div>
                  <span className="font-bold text-gray-900">{h.symbol}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {h.quantity} {h.quantity === 1 ? 'share' : 'shares'} @ ${h.currentPrice?.toFixed(2) ?? 'N/A'}
                  </span>
                </div>
                <span className="font-semibold text-gray-900">${h.value?.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-gray-400 py-3 text-center bg-gray-50 rounded">
            No active positions at this timestamp.
          </div>
        )}
      </div>
    </div>
  );
}
