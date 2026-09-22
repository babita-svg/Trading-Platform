import { NextResponse } from 'next/server';
import { loadMarketData, getPrice, getKnownSymbols } from '@/lib/market.js';
import { getPortfolioStatus } from '@/lib/portfolio.js';

export async function GET(request) {
  await loadMarketData();

  const { searchParams } = new URL(request.url);
  const datetime = searchParams.get('datetime');

  if (!datetime) {
    return NextResponse.json(
      { message: 'datetime query param is required (YYYY-MM-DD HH:MM)' },
      { status: 400 }
    );
  }

  const symbols = getKnownSymbols();
  const probe = getPrice(symbols[0], datetime);
  if (probe === null) {
    return NextResponse.json(
      { message: `no market data found for datetime "${datetime}"` },
      { status: 400 }
    );
  }

  return NextResponse.json(getPortfolioStatus(datetime));
}
