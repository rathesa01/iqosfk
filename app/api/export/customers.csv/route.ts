import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/utils/auth';
import { csvResponse, toCsv } from '@/lib/utils/csv';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  await requireUser();

  const rows = await db.execute<{
    name: string;
    phone: string;
    lineId: string | null;
    segment: string;
    status: string;
    totalOrders: number;
    totalPieces: number;
    avgFreqDays: string | null;
    firstOrderDate: string | null;
    lastOrderDate: string | null;
    nextExpectedDate: string | null;
    tags: string;
    notes: string | null;
  }>(sql`
    SELECT
      name,
      phone,
      line_id        AS "lineId",
      segment::text  AS segment,
      status::text   AS status,
      total_orders   AS "totalOrders",
      total_pieces   AS "totalPieces",
      avg_freq_days::text AS "avgFreqDays",
      to_char((first_order_date AT TIME ZONE 'Asia/Bangkok'), 'YYYY-MM-DD') AS "firstOrderDate",
      to_char((last_order_date  AT TIME ZONE 'Asia/Bangkok'), 'YYYY-MM-DD') AS "lastOrderDate",
      to_char((next_expected_date AT TIME ZONE 'Asia/Bangkok'), 'YYYY-MM-DD') AS "nextExpectedDate",
      array_to_string(tags, '|') AS tags,
      notes
    FROM public.customers
    ORDER BY total_orders DESC, name ASC
  `);

  const csv = toCsv(rows, [
    { key: 'name', header: 'Name' },
    { key: 'phone', header: 'Phone' },
    { key: 'lineId', header: 'LINE' },
    { key: 'segment', header: 'Segment' },
    { key: 'status', header: 'Status' },
    { key: 'totalOrders', header: 'Total Orders' },
    { key: 'totalPieces', header: 'Total Pieces' },
    { key: 'avgFreqDays', header: 'Avg Freq (days)' },
    { key: 'firstOrderDate', header: 'First Order' },
    { key: 'lastOrderDate', header: 'Last Order' },
    { key: 'nextExpectedDate', header: 'Next Expected' },
    { key: 'tags', header: 'Tags' },
    { key: 'notes', header: 'Notes' },
  ]);

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`customers_${stamp}.csv`, csv);
}
