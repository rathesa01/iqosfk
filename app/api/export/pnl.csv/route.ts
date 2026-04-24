import { type NextRequest } from 'next/server';
import { requireUser } from '@/lib/utils/auth';
import { csvResponse, toCsv } from '@/lib/utils/csv';
import { getPnl } from '@/lib/analytics/finance';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  await requireUser();
  const granularity = (req.nextUrl.searchParams.get('granularity') as 'day' | 'month') ?? 'day';
  const days = Math.min(720, Math.max(1, Number(req.nextUrl.searchParams.get('days')) || 90));

  const rows = await getPnl(granularity === 'month' ? 'month' : 'day', days);

  const csv = toCsv(rows, [
    { key: 'bucket', header: 'Period' },
    { key: 'orderCount', header: 'Orders' },
    { key: 'revenue', header: 'Revenue' },
    { key: 'cogs', header: 'COGS' },
    { key: 'grossProfit', header: 'Gross Profit' },
    { key: 'expenses', header: 'Expenses' },
    { key: 'netProfit', header: 'Net Profit' },
  ]);

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`pnl_${granularity}_${days}d_${stamp}.csv`, csv);
}
