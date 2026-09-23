"use client";

import React, { useState } from 'react';

export default function TradeModal({ tradeAction, datetime, onClose, onSuccess }) {
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!tradeAction) return null;

  const { stock, type } = tradeAction;
  const parsedQty = parseInt(quantity, 10);
  const estimatedTotal = !isNaN(parsedQty) && parsedQty > 0 && stock.price
    ? (parsedQty * stock.price).toFixed(2)
    : '0.00';

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
              type === 'buy' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {type} Order
            </span>
            <h2 className="text-lg font-bold text-gray-900">{stock.symbol}</h2>
          </div>
          <span className="text-xs text-gray-400 font-mono">{datetime}</span>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm">
          <div className="flex justify-between text-gray-600 mb-1">
            <span>Company:</span>
            <span className="font-medium text-gray-900">{stock.name}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Execution Price:</span>
            <span className="font-bold text-gray-900">${stock.price?.toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs font-medium mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Quantity (Shares)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 10"
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div className="flex justify-between items-center py-2 px-3 bg-blue-50/60 rounded-lg mb-6 text-sm">
            <span className="text-gray-600 font-medium">Estimated Total:</span>
            <span className="text-base font-bold text-blue-900">${estimatedTotal}</span>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-lg text-white text-sm font-semibold transition shadow-sm ${
                type === 'buy'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              } disabled:opacity-50`}
              disabled={loading || !quantity || parsedQty <= 0}
            >
              {loading ? 'Executing...' : `Confirm ${type.toUpperCase()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
