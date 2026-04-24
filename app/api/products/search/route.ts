import { NextResponse, type NextRequest } from 'next/server';
import { searchProductsForOrder } from '@/app/(dashboard)/orders/actions';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  if (!q.trim()) return NextResponse.json([]);
  const rows = await searchProductsForOrder(q);
  return NextResponse.json(rows);
}
