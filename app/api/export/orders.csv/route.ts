import { type NextRequest } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/utils/auth';
import { csvResponse, toCsv } from '@/lib/utils/csv';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  await requireUser();
  const days = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get('days')) || 30));

  const rows = await db.execute<{
    orderNumber: string;
    orderDate: string;
    customerName: string;
    customerPhone: string;
    deliveryMethod: string | null;
    status: string;
    totalPieces: number;
    totalAmount: string;
    notes: string | null;
  }>(sql`
    SELECT
      o.order_number AS "orderNumber",
      to_char((o.order_date AT TIME ZONE 'Asia/Bangkok'), 'YYYY-MM-DD HH24:MI') AS "orderDate",
      c.name         AS "customerName",
      c.phone        AS "customerPhone",
      o.delivery_method AS "deliveryMethod",
      o.status::text AS status,
      o.total_pieces AS "totalPieces",
      o.total_amount::text AS "totalAmount",
      o.notes
    FROM public.orders o
    JOIN public.customers c ON c.id = o.customer_id
    WHERE o.order_date >= now() - (${days}::int * INTERVAL '1 day')
    ORDER BY o.order_date DESC
  `);

  const csv = toCsv(rows, [
    { key: 'orderNumber', header: 'Order Number' },
    { key: 'orderDate', header: 'Order Date (BKK)' },
    { key: 'customerName', header: 'Customer' },
    { key: 'customerPhone', header: 'Phone' },
    { key: 'deliveryMethod', header: 'Delivery' },
    { key: 'status', header: 'Status' },
    { key: 'totalPieces', header: 'Pieces' },
    { key: 'totalAmount', header: 'Amount' },
    { key: 'notes', header: 'Notes' },
  ]);

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`orders_${days}d_${stamp}.csv`, csv);
}
