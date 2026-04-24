/**
 * Migrate orders from Google Sheets CSV export.
 *
 * Expected CSV columns (rename in `mapRow` if your sheet differs):
 *   date, customer_name, phone, line_id, product_sku, quantity,
 *   unit_price, delivery_method, location, notes
 *
 * Usage:
 *   npx tsx scripts/migrate-from-sheet.ts ./orders.csv
 *
 * What it does:
 *   1. Read CSV (one line = one order line item)
 *   2. Group by (date + phone) -> one order, multiple items
 *   3. Upsert customers (deduplicate by normalised phone)
 *   4. Upsert products (deduplicate by SKU)
 *   5. Insert orders + order_items in one transaction per order
 *   6. Skip rows already migrated (matched by external_ref hash)
 *
 * Trigger `recompute_customer_analytics` will fire automatically and
 * fill in segment / status / freq for each affected customer.
 */
import { config } from 'dotenv';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import postgres from 'postgres';

config({ path: '.env.local' });

type SheetRow = {
  date: string;
  customer_name: string;
  phone: string;
  line_id?: string;
  product_sku: string;
  product_name?: string;
  quantity: string;
  unit_price?: string;
  cost_price?: string;
  delivery_method?: string;
  location?: string;
  notes?: string;
};

function normalisePhone(raw: string): string {
  const d = (raw ?? '').replace(/\D/g, '');
  if (!d) return '';
  const t = d.startsWith('66') ? d.slice(2) : d;
  return t.startsWith('0') ? t : `0${t}`;
}

function parseCsv(text: string): SheetRow[] {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const header = splitCsvLine(lines[0]!).map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const obj: Record<string, string> = {};
    header.forEach((k, i) => (obj[k] = (cells[i] ?? '').trim()));
    return obj as SheetRow;
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        q = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      q = true;
    } else if (c === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: tsx scripts/migrate-from-sheet.ts <path-to-csv>');
    process.exit(1);
  }
  const text = readFileSync(file, 'utf8');
  const rows = parseCsv(text);
  console.log(`📥 Parsed ${rows.length} CSV rows`);

  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

  // 1. Build unique customer + product maps
  const custByPhone = new Map<string, { name: string; lineId?: string }>();
  const prodBySku = new Map<string, { name: string }>();
  for (const r of rows) {
    const phone = normalisePhone(r.phone);
    if (!phone) continue;
    if (!custByPhone.has(phone)) {
      custByPhone.set(phone, { name: r.customer_name || phone, lineId: r.line_id });
    }
    if (r.product_sku && !prodBySku.has(r.product_sku.trim())) {
      prodBySku.set(r.product_sku.trim(), {
        name: (r.product_name || r.product_sku).trim(),
      });
    }
  }

  // 2. Upsert customers
  console.log(`👥 Upserting ${custByPhone.size} customers…`);
  const customerIdByPhone = new Map<string, string>();
  for (const [phone, c] of custByPhone) {
    const [row] = await sql<{ id: string }[]>`
      INSERT INTO public.customers (name, phone, line_id)
      VALUES (${c.name}, ${phone}, ${c.lineId ?? null})
      ON CONFLICT (phone) DO UPDATE SET line_id = COALESCE(EXCLUDED.line_id, public.customers.line_id)
      RETURNING id
    `;
    customerIdByPhone.set(phone, row!.id);
  }

  // 3. Upsert products
  console.log(`📦 Upserting ${prodBySku.size} products…`);
  const productIdBySku = new Map<string, string>();
  for (const [sku, p] of prodBySku) {
    const [row] = await sql<{ id: string }[]>`
      INSERT INTO public.products (sku, name)
      VALUES (${sku}, ${p.name})
      ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;
    productIdBySku.set(sku, row!.id);
  }

  // 4. Group rows by (date + phone) -> orders
  console.log('🧾 Grouping into orders…');
  const orderMap = new Map<
    string,
    { date: string; phone: string; items: SheetRow[]; deliveryMethod?: string; location?: string; notes?: string }
  >();
  for (const r of rows) {
    const phone = normalisePhone(r.phone);
    if (!phone || !r.date) continue;
    const key = `${r.date}|${phone}`;
    if (!orderMap.has(key)) {
      orderMap.set(key, {
        date: r.date,
        phone,
        items: [],
        deliveryMethod: r.delivery_method,
        location: r.location,
        notes: r.notes,
      });
    }
    orderMap.get(key)!.items.push(r);
  }
  console.log(`   -> ${orderMap.size} orders`);

  // 5. Insert orders, skip if external_ref already migrated
  let inserted = 0;
  let skipped = 0;
  for (const [key, group] of orderMap) {
    const ref = createHash('sha1').update(key).digest('hex');
    const customerId = customerIdByPhone.get(group.phone);
    if (!customerId) continue;

    const [{ exists }] = await sql<{ exists: boolean }[]>`
      SELECT EXISTS(SELECT 1 FROM public.orders WHERE notes LIKE ${'%MIGRATED:' + ref + '%'}) AS exists
    `;
    if (exists) {
      skipped++;
      continue;
    }

    const orderDate = new Date(group.date);
    if (isNaN(orderDate.getTime())) continue;

    await sql.begin(async (tx) => {
      const [{ orderNumber }] = await tx<{ orderNumber: string }[]>`
        SELECT public.generate_order_number(${orderDate}::date) AS "orderNumber"
      `;

      const [order] = await tx<{ id: string }[]>`
        INSERT INTO public.orders
          (order_number, customer_id, order_date, delivery_method, delivery_location, notes, status)
        VALUES (
          ${orderNumber}, ${customerId}, ${orderDate.toISOString()},
          ${group.deliveryMethod ?? null}, ${group.location ?? null},
          ${'MIGRATED:' + ref + ' ' + (group.notes ?? '')}, 'confirmed'
        )
        RETURNING id
      `;
      const orderId = order!.id;

      for (const it of group.items) {
        const productId = productIdBySku.get(it.product_sku.trim());
        if (!productId) continue;
        const qty = parseInt(it.quantity, 10) || 1;
        const price = parseFloat(it.unit_price ?? '0') || 0;
        const cost = parseFloat(it.cost_price ?? '0') || 0;
        await tx`
          INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, unit_cost, subtotal)
          VALUES (${orderId}, ${productId}, ${qty}, ${price.toFixed(2)}, ${cost.toFixed(2)}, ${(price * qty).toFixed(2)})
        `;
      }
    });

    inserted++;
    if (inserted % 100 === 0) console.log(`   …${inserted} inserted`);
  }

  console.log(`\n✅ Done. Inserted ${inserted} orders. Skipped ${skipped} already-migrated.`);
  await sql.end();
}

main().catch((e) => {
  console.error('❌ migration failed:', e);
  process.exit(1);
});
