"use client";

import React, { useState } from 'react';

export default function TradeModal({ tradeAction, datetime, onClose, onSuccess }) {
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!tradeAction) return null;

  const { stock, type } = tradeAction;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: stock.symbol,
          action: type,
          quantity: parseInt(quantity, 10),
          datetime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message ?? 'Trade failed');
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-1 capitalize">{type} {stock.symbol}</h2>
        <p className="text-gray-500 mb-4">{stock.name} @ ${stock.price?.toFixed(2)}</p>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (Shares)</label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded text-white font-medium ${
                type === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              } disabled:opacity-50`}
              disabled={loading || !quantity}
            >
              {loading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
