import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export type PnlBucket = {
  bucket: string; // YYYY-MM-DD or YYYY-MM
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  orderCount: number;
};

/**
 * P&L by day/month — costs are taken from order_items.unit_cost snapshot
 * (so historic profit is preserved even after product cost changes).
 */
export async function getPnl(
  granularity: 'day' | 'month',
  days: number,
): Promise<PnlBucket[]> {
  const trunc = granularity === 'day' ? 'day' : 'month';
  const fmt = granularity === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM';

  return await db.execute<PnlBucket>(sql`
    WITH range AS (
      SELECT
        ((now() AT TIME ZONE 'Asia/Bangkok')::date - (${days - 1}::int) * INTERVAL '1 day') AS start_d
    ),
    series AS (
      SELECT generate_series(
        date_trunc(${trunc}, (SELECT start_d FROM range))::date,
        date_trunc(${trunc}, (now() AT TIME ZONE 'Asia/Bangkok')::date)::date,
        (CASE WHEN ${trunc} = 'day' THEN INTERVAL '1 day' ELSE INTERVAL '1 month' END)
      )::date AS bucket_start
    ),
    revenue_by_bucket AS (
      SELECT
        date_trunc(${trunc}, (o.order_date AT TIME ZONE 'Asia/Bangkok'))::date AS bucket_start,
        SUM(oi.subtotal)::float                          AS revenue,
        SUM(oi.unit_cost * oi.quantity)::float           AS cogs,
        COUNT(DISTINCT o.id)::int                        AS order_count
      FROM public.orders o
      JOIN public.order_items oi ON oi.order_id = o.id
      WHERE o.status = 'confirmed'
        AND ((o.order_date AT TIME ZONE 'Asia/Bangkok')::date) >= (SELECT start_d FROM range)
      GROUP BY 1
    ),
    expenses_by_bucket AS (
      SELECT
        date_trunc(${trunc}, (e.expense_date AT TIME ZONE 'Asia/Bangkok'))::date AS bucket_start,
        SUM(e.amount)::float AS expenses
      FROM public.expenses e
      WHERE ((e.expense_date AT TIME ZONE 'Asia/Bangkok')::date) >= (SELECT start_d FROM range)
      GROUP BY 1
    )
    SELECT
      to_char(s.bucket_start, ${fmt})                                   AS bucket,
      COALESCE(r.revenue, 0)                                            AS revenue,
      COALESCE(r.cogs, 0)                                               AS cogs,
      COALESCE(r.revenue, 0) - COALESCE(r.cogs, 0)                      AS "grossProfit",
      COALESCE(e.expenses, 0)                                           AS expenses,
      (COALESCE(r.revenue, 0) - COALESCE(r.cogs, 0) - COALESCE(e.expenses, 0)) AS "netProfit",
      COALESCE(r.order_count, 0)                                        AS "orderCount"
    FROM series s
    LEFT JOIN revenue_by_bucket  r ON r.bucket_start = s.bucket_start
    LEFT JOIN expenses_by_bucket e ON e.bucket_start = s.bucket_start
    ORDER BY s.bucket_start
  `);
}

export type ExpenseRow = {
  id: string;
  expenseDate: Date;
  category: string;
  amount: number;
  description: string | null;
};

export async function listExpenses(limit = 100): Promise<ExpenseRow[]> {
  return await db.execute<ExpenseRow>(sql`
    SELECT id, expense_date AS "expenseDate", category,
           amount::float AS amount, description
      FROM public.expenses
     ORDER BY expense_date DESC, created_at DESC
     LIMIT ${limit}
  `);
}
