import { NextResponse } from 'next/server';
import { loadMarketData, getMarketRange } from '@/lib/market.js';

export async function GET() {
  await loadMarketData();
  return NextResponse.json(getMarketRange());
}
