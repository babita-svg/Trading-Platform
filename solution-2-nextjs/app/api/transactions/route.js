import { NextResponse } from 'next/server';
import { getTransactions } from '@/lib/portfolio.js';

export async function GET() {
  return NextResponse.json(getTransactions());
}
