import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

/* -------------------------------------------------------------------------- */
/*  Today snapshot                                                             */
/* -------------------------------------------------------------------------- */

export type TodaySnapshot = {
  ordersToday: number;
  piecesToday: number;
  amountToday: number;
  newCustomersToday: number;
  dueToContactCount: number;
  lowStockCount: number;
  ordersThisMonth: number;
  amountThisMonth: number;
  amountLastMonth: number;
};

export async function getTodaySnapshot(): Promise<TodaySnapshot> {
  const rows = await db.execute<TodaySnapshot>(sql`
    WITH bkk_now AS (
      SELECT (now() AT TIME ZONE 'Asia/Bangkok')::date AS today
    ),
    today_range AS (
      SELECT
        ((SELECT today FROM bkk_now)::timestamp AT TIME ZONE 'Asia/Bangkok')                 AS start_ts,
        (((SELECT today FROM bkk_now) + INTERVAL '1 day')::timestamp AT TIME ZONE 'Asia/Bangkok') AS end_ts
    ),
    month_range AS (
      SELECT
        (date_trunc('month', (SELECT today FROM bkk_now))::timestamp AT TIME ZONE 'Asia/Bangkok')                AS start_ts,
        ((date_trunc('month', (SELECT today FROM bkk_now)) + INTERVAL '1 month')::timestamp AT TIME ZONE 'Asia/Bangkok') AS end_ts
    ),
    last_month_range AS (
      SELECT
        ((date_trunc('month', (SELECT today FROM bkk_now)) - INTERVAL '1 month')::timestamp AT TIME ZONE 'Asia/Bangkok') AS start_ts,
        (date_trunc('month', (SELECT today FROM bkk_now))::timestamp AT TIME ZONE 'Asia/Bangkok')                       AS end_ts
    )
    SELECT
      (SELECT COUNT(*)::int FROM public.orders o, today_range t
        WHERE o.order_date >= t.start_ts AND o.order_date < t.end_ts AND o.status = 'confirmed')             AS "ordersToday",
      (SELECT COALESCE(SUM(o.total_pieces),0)::int FROM public.orders o, today_range t
        WHERE o.order_date >= t.start_ts AND o.order_date < t.end_ts AND o.status = 'confirmed')             AS "piecesToday",
      (SELECT COALESCE(SUM(o.total_amount),0)::float FROM public.orders o, today_range t
        WHERE o.order_date >= t.start_ts AND o.order_date < t.end_ts AND o.status = 'confirmed')             AS "amountToday",
      (SELECT COUNT(*)::int FROM public.customers c, today_range t
        WHERE c.created_at >= t.start_ts AND c.created_at < t.end_ts)                                        AS "newCustomersToday",
      (SELECT COUNT(*)::int FROM public.customers c
        WHERE c.next_expected_date IS NOT NULL
          AND c.next_expected_date <= now()
          AND c.status IN ('active','cooling','cold'))                                                       AS "dueToContactCount",
      (SELECT COUNT(*)::int FROM public.products p
        WHERE p.is_active AND p.current_stock <= p.low_stock_threshold)                                      AS "lowStockCount",
      (SELECT COUNT(*)::int FROM public.orders o, month_range m
        WHERE o.order_date >= m.start_ts AND o.order_date < m.end_ts AND o.status = 'confirmed')             AS "ordersThisMonth",
      (SELECT COALESCE(SUM(o.total_amount),0)::float FROM public.orders o, month_range m
        WHERE o.order_date >= m.start_ts AND o.order_date < m.end_ts AND o.status = 'confirmed')             AS "amountThisMonth",
      (SELECT COALESCE(SUM(o.total_amount),0)::float FROM public.orders o, last_month_range l
        WHERE o.order_date >= l.start_ts AND o.order_date < l.end_ts AND o.status = 'confirmed')             AS "amountLastMonth"
  `);
  return rows[0] ?? {
    ordersToday: 0,
    piecesToday: 0,
    amountToday: 0,
    newCustomersToday: 0,
    dueToContactCount: 0,
    lowStockCount: 0,
    ordersThisMonth: 0,
    amountThisMonth: 0,
    amountLastMonth: 0,
  };
}

/* -------------------------------------------------------------------------- */
/*  Customers due to contact today                                             */
/* -------------------------------------------------------------------------- */

export type DueCustomer = {
  id: string;
  name: string;
  phone: string;
  lineId: string | null;
  segment: string;
  status: string;
  totalOrders: number;
  totalPieces: number;
  lastOrderDate: Date | null;
  avgFreqDays: number | null;
  nextExpectedDate: Date | null;
  daysSince: number;
  daysOverdue: number;
};

export async function getDueCustomers(limit = 50): Promise<DueCustomer[]> {
  return await db.execute<DueCustomer>(sql`
    SELECT
      c.id,
      c.name,
      c.phone,
      c.line_id        AS "lineId",
      c.segment::text  AS segment,
      c.status::text   AS status,
      c.total_orders   AS "totalOrders",
      c.total_pieces   AS "totalPieces",
      c.last_order_date AS "lastOrderDate",
      c.avg_freq_days::float AS "avgFreqDays",
      c.next_expected_date   AS "nextExpectedDate",
      EXTRACT(DAY FROM (now() - c.last_order_date))::int AS "daysSince",
      EXTRACT(DAY FROM (now() - c.next_expected_date))::int AS "daysOverdue"
    FROM public.customers c
    WHERE c.next_expected_date IS NOT NULL
      AND c.next_expected_date <= now()
      AND c.status IN ('active','cooling','cold')
    ORDER BY c.next_expected_date ASC
    LIMIT ${limit}
  `);
}

/* -------------------------------------------------------------------------- */
/*  Daily sales (for given range)                                              */
/* -------------------------------------------------------------------------- */

export type DailySalesRow = {
  day: string; // YYYY-MM-DD
  orderCount: number;
  pieces: number;
  amount: number;
  newCustomers: number;
};

export async function getDailySales(days = 30): Promise<DailySalesRow[]> {
  return await db.execute<DailySalesRow>(sql`
    WITH range AS (
      SELECT
        ((now() AT TIME ZONE 'Asia/Bangkok')::date - (${days - 1}::int) * INTERVAL '1 day') AS start_d,
        (now() AT TIME ZONE 'Asia/Bangkok')::date AS end_d
    ),
    days_series AS (
      SELECT generate_series(
        (SELECT start_d FROM range)::date,
        (SELECT end_d FROM range)::date,
        INTERVAL '1 day'
      )::date AS day
    ),
    orders_by_day AS (
      SELECT
        ((o.order_date AT TIME ZONE 'Asia/Bangkok')::date) AS day,
        COUNT(*)::int                                       AS order_count,
        COALESCE(SUM(o.total_pieces), 0)::int               AS pieces,
        COALESCE(SUM(o.total_amount), 0)::float             AS amount
      FROM public.orders o
      WHERE o.status = 'confirmed'
        AND ((o.order_date AT TIME ZONE 'Asia/Bangkok')::date) >= (SELECT start_d FROM range)
      GROUP BY 1
    ),
    new_cust_by_day AS (
      SELECT
        ((c.created_at AT TIME ZONE 'Asia/Bangkok')::date) AS day,
        COUNT(*)::int AS new_customers
      FROM public.customers c
      WHERE ((c.created_at AT TIME ZONE 'Asia/Bangkok')::date) >= (SELECT start_d FROM range)
      GROUP BY 1
    )
    SELECT
      to_char(d.day, 'YYYY-MM-DD')      AS day,
      COALESCE(o.order_count, 0)        AS "orderCount",
      COALESCE(o.pieces, 0)             AS "pieces",
      COALESCE(o.amount, 0)             AS "amount",
      COALESCE(n.new_customers, 0)      AS "newCustomers"
    FROM days_series d
    LEFT JOIN orders_by_day o   ON o.day = d.day
    LEFT JOIN new_cust_by_day n ON n.day = d.day
    ORDER BY d.day ASC
  `);
}

/* -------------------------------------------------------------------------- */
/*  Top products                                                               */
/* -------------------------------------------------------------------------- */

export type TopProductRow = {
  productId: string;
  sku: string;
  name: string;
  category: string | null;
  pieces: number;
  amount: number;
  orderCount: number;
};

export async function getTopProducts(days = 30, limit = 10): Promise<TopProductRow[]> {
  return await db.execute<TopProductRow>(sql`
    WITH range AS (
      SELECT
        (((now() AT TIME ZONE 'Asia/Bangkok')::date - (${days - 1}::int) * INTERVAL '1 day')::timestamp AT TIME ZONE 'Asia/Bangkok') AS start_ts
    )
    SELECT
      p.id            AS "productId",
      p.sku           AS sku,
      p.name          AS name,
      cat.name        AS category,
      SUM(oi.quantity)::int     AS pieces,
      SUM(oi.subtotal)::float   AS amount,
      COUNT(DISTINCT o.id)::int AS "orderCount"
    FROM public.order_items oi
    INNER JOIN public.orders o    ON o.id = oi.order_id AND o.status = 'confirmed'
    INNER JOIN public.products p  ON p.id = oi.product_id
    LEFT  JOIN public.categories cat ON cat.id = p.category_id
    WHERE o.order_date >= (SELECT start_ts FROM range)
    GROUP BY p.id, p.sku, p.name, cat.name
    ORDER BY pieces DESC
    LIMIT ${limit}
  `);
}

/* -------------------------------------------------------------------------- */
/*  Top customers (lifetime)                                                   */
/* -------------------------------------------------------------------------- */

export type TopCustomerRow = {
  id: string;
  name: string;
  phone: string;
  segment: string;
  totalOrders: number;
  totalPieces: number;
  lastOrderDate: Date | null;
};

export async function getTopCustomers(limit = 10): Promise<TopCustomerRow[]> {
  return await db.execute<TopCustomerRow>(sql`
    SELECT
      c.id,
      c.name,
      c.phone,
      c.segment::text   AS segment,
      c.total_orders    AS "totalOrders",
      c.total_pieces    AS "totalPieces",
      c.last_order_date AS "lastOrderDate"
    FROM public.customers c
    WHERE c.total_orders > 0
    ORDER BY c.total_orders DESC, c.total_pieces DESC
    LIMIT ${limit}
  `);
}

/* -------------------------------------------------------------------------- */
/*  Segment + status distribution                                              */
/* -------------------------------------------------------------------------- */

export type CountByKey = { key: string; count: number };

export async function getSegmentDistribution(): Promise<CountByKey[]> {
  return await db.execute<CountByKey>(sql`
    SELECT segment::text AS key, COUNT(*)::int AS count
      FROM public.customers
     GROUP BY segment
     ORDER BY count DESC
  `);
}

export async function getStatusDistribution(): Promise<CountByKey[]> {
  return await db.execute<CountByKey>(sql`
    SELECT status::text AS key, COUNT(*)::int AS count
      FROM public.customers
     GROUP BY status
     ORDER BY count DESC
  `);
}

/* -------------------------------------------------------------------------- */
/*  Day-of-week × week heatmap                                                 */
/* -------------------------------------------------------------------------- */

export type HeatCell = { weekStart: string; dow: number; pieces: number; amount: number };

export async function getHeatmap(weeks = 8): Promise<HeatCell[]> {
  return await db.execute<HeatCell>(sql`
    WITH range AS (
      SELECT
        date_trunc('week', (now() AT TIME ZONE 'Asia/Bangkok')::date - (${weeks - 1}::int) * INTERVAL '7 day')::date AS start_d
    )
    SELECT
      to_char(date_trunc('week', (o.order_date AT TIME ZONE 'Asia/Bangkok')::date)::date, 'YYYY-MM-DD') AS "weekStart",
      EXTRACT(ISODOW FROM (o.order_date AT TIME ZONE 'Asia/Bangkok'))::int                              AS dow,
      SUM(o.total_pieces)::int                                                                          AS pieces,
      SUM(o.total_amount)::float                                                                        AS amount
    FROM public.orders o
    WHERE o.status = 'confirmed'
      AND ((o.order_date AT TIME ZONE 'Asia/Bangkok')::date) >= (SELECT start_d FROM range)
    GROUP BY 1, 2
    ORDER BY 1, 2
  `);
}

/* -------------------------------------------------------------------------- */
/*  Recent activity (latest orders)                                            */
/* -------------------------------------------------------------------------- */

export type RecentOrderRow = {
  id: string;
  orderNumber: string;
  orderDate: Date;
  customerName: string;
  totalPieces: number;
  totalAmount: number;
};

export async function getRecentOrders(limit = 8): Promise<RecentOrderRow[]> {
  return await db.execute<RecentOrderRow>(sql`
    SELECT
      o.id,
      o.order_number       AS "orderNumber",
      o.order_date         AS "orderDate",
      c.name               AS "customerName",
      o.total_pieces       AS "totalPieces",
      o.total_amount::float AS "totalAmount"
    FROM public.orders o
    INNER JOIN public.customers c ON c.id = o.customer_id
    ORDER BY o.order_date DESC
    LIMIT ${limit}
  `);
}
