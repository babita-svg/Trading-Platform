import { NextResponse } from 'next/server';
import { loadMarketData } from '@/lib/market.js';
import { executeTrade } from '@/lib/portfolio.js';

export async function POST(request) {
  try {
    await loadMarketData();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: 'Invalid JSON payload in request body' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { message: 'Request body must be a JSON object' },
        { status: 400 }
      );
    }

    const { symbol, action, quantity, datetime } = body;

    const missing = ['symbol', 'action', 'quantity', 'datetime'].filter(
      (f) => body[f] === undefined || body[f] === null || body[f] === ''
    );
    if (missing.length > 0) {
      return NextResponse.json(
        { message: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const qty = typeof quantity === 'number' ? quantity : Number(quantity);

    try {
      const result = executeTrade(symbol, action, qty, datetime);
      return NextResponse.json(result, { status: 201 });
    } catch (err) {
      const status = err.status ?? 500;
      const message = err.message ?? 'Unexpected server error while processing trade';
      return NextResponse.json({ message }, { status });
    }
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
