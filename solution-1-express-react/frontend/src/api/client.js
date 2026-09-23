const API_URL = 'http://localhost:3001/api';

/**
 * Extracts the error message from a failed API response.
 * The server always sends { message: "..." } on errors.
 */
async function extractError(res) {
  try {
    const body = await res.json();
    return body.message ?? `Request failed with status ${res.status}`;
  } catch {
    return `Request failed with status ${res.status}`;
  }
}

export async function getMarketRange() {
  const res = await fetch(`${API_URL}/market/range`);
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function getStocks(datetime) {
  const params = new URLSearchParams({ datetime });
  const res = await fetch(`${API_URL}/stocks?${params.toString()}`);
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function getPortfolio(datetime) {
  const params = new URLSearchParams({ datetime });
  const res = await fetch(`${API_URL}/portfolio?${params.toString()}`);
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function getTransactions() {
  const res = await fetch(`${API_URL}/transactions`);
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function placeTrade({ symbol, action, quantity, datetime }) {
  const res = await fetch(`${API_URL}/trade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, action, quantity, datetime }),
  });
  if (!res.ok) {
    // Forward the descriptive server message (e.g. "insufficient cash: ...") to the UI
    throw new Error(await extractError(res));
  }
  return res.json();
}
