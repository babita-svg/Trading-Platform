import { NextResponse } from 'next/server';
import { loadMarketData, getPrice, getOpenPrice, getKnownSymbols, getStockName } from '@/lib/market.js';

export async function GET(request) {
  try {
    await loadMarketData();

    const { searchParams } = new URL(request.url);
    const datetime = searchParams.get('datetime');

    if (!datetime || typeof datetime !== 'string') {
      return NextResponse.json(
        { message: 'datetime query parameter is required (YYYY-MM-DD HH:MM)' },
        { status: 400 }
      );
    }

    const symbols = getKnownSymbols();

    // Probe first symbol to validate requested datetime exists in dataset
    const probe = getPrice(symbols[0], datetime);
    if (probe === null) {
      return NextResponse.json(
        { message: `no market data found for datetime "${datetime}"` },
        { status: 400 }
      );
    }

    const stocks = symbols.map((symbol) => {
      const price = getPrice(symbol, datetime);
      const openPrice = getOpenPrice(symbol, datetime);
      let change = 0;
      let changePct = 0;

      if (openPrice && openPrice > 0 && price !== null) {
        change = parseFloat((price - openPrice).toFixed(2));
        changePct = parseFloat(((change / openPrice) * 100).toFixed(2));
      }

      return {
        symbol,
        name: getStockName(symbol),
        price,
        openPrice,
        change,
        changePct,
      };
    });

    return NextResponse.json({ datetime, stocks });
  } catch {
    return NextResponse.json(
      { message: 'Internal server error while retrieving stocks' },
      { status: 500 }
    );
  }
}
