import { NextResponse } from 'next/server';
import { loadMarketData } from '@/lib/market.js';
import { executeTrade } from '@/lib/portfolio.js';

export async function POST(request) {
  await loadMarketData();

  const body = await request.json().catch(() => ({}));
  const { symbol, action, quantity, datetime } = body;

  const missing = ['symbol', 'action', 'quantity', 'datetime'].filter(
    (f) => body[f] === undefined || body[f] === null || body[f] === ''
  );
  if (missing.length > 0) {
    return NextResponse.json(
      { message: `missing required fields: ${missing.join(', ')}` },
      { status: 400 }
    );
  }

  const qty = Number(quantity);

  try {
    const result = executeTrade(symbol, action, qty, datetime);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const status = err.status ?? 500;
    const message = err.message ?? 'unexpected server error';
    return NextResponse.json({ message }, { status });
  }
}
