import React from 'react';

export default function MarketTable({ stocks, onTrade }) {
  if (!stocks || stocks.length === 0) {
    return <div className="text-gray-500">No market data available.</div>;
  }

  return (
    <div className="bg-white rounded shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {stocks.map((stock) => (
            <tr key={stock.symbol} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{stock.symbol}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stock.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                ${stock.price?.toFixed(2) || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <button
                  onClick={() => onTrade(stock, 'buy')}
                  className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-medium mr-2 hover:bg-green-200"
                >
                  Buy
                </button>
                <button
                  onClick={() => onTrade(stock, 'sell')}
                  className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm font-medium hover:bg-red-200"
                >
                  Sell
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
