const API_URL = 'http://localhost:3001/api';

export async function getMarketRange() {
  const res = await fetch(`${API_URL}/market/range`);
  if (!res.ok) throw new Error('Failed to fetch market range');
  return res.json();
}

export async function getStocks(datetime) {
  const params = new URLSearchParams({ datetime });
  const res = await fetch(`${API_URL}/stocks?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch stocks');
  return res.json();
}

export async function getPortfolio(datetime) {
  const params = new URLSearchParams({ datetime });
  const res = await fetch(`${API_URL}/portfolio?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch portfolio');
  return res.json();
}

export async function placeTrade({ symbol, action, quantity, datetime }) {
  const res = await fetch(`${API_URL}/trade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, action, quantity, datetime }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to place trade');
  }
  return res.json();
}
