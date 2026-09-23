"use client";

import React from 'react';

export default function MarketTable({ stocks, onTrade }) {
  if (!stocks || stocks.length === 0) {
    return <div className="text-gray-500 py-6 text-center bg-white rounded shadow">No simulated market data available.</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Symbol</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Simulated Price</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Day Change</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {stocks.map((stock) => {
              const isPositive = stock.change >= 0;
              return (
                <tr key={stock.symbol} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-900">{stock.symbol}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">{stock.name}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                    ${stock.price?.toFixed(2) ?? 'N/A'}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {isPositive ? '+' : ''}{stock.change?.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePct?.toFixed(2)}%)
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-center space-x-2">
                    <button
                      onClick={() => onTrade(stock, 'buy')}
                      className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-emerald-700 transition shadow-sm"
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => onTrade(stock, 'sell')}
                      className="bg-rose-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-rose-700 transition shadow-sm"
                    >
                      Sell
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
