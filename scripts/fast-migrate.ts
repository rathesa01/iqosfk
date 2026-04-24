/**
 * FAST batch migration from CSV.
 *
 * Strategy:
 * 1. Truncate orders + order_items (keep customers + products to avoid re-upsert)
 * 2. Disable per-row triggers (recompute_customer_analytics + order_items_after)
 * 3. Pre-compute order numbers in JS
 * 4. Batch INSERT 500 orders / statement
 * 5. Batch INSERT 1000 order_items / statement
 * 6. Re-enable triggers
 * 7. One-shot recompute_customer_analytics for every customer
 *
 * Goal: complete 8,785 orders + 10,860 items in ~2 minutes.
 */
import { config } from 'dotenv';
import { readFileSync } from 'node:fs';
import postgres from 'postgres';

config({ path: '.env.local' });

type Row = {
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

function parseCsv(text: string): Row[] {
  const clean = text.replace(/^\uFEFF/, '').replace(/\r/g, '');
  const lines = clean.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const header = splitCsvLine(lines[0]!).map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const o: Record<string, string> = {};
    header.forEach((k, i) => (o[k] = (cells[i] ?? '').trim()));
    return o as Row;
  });
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: tsx scripts/fast-migrate.ts <csv>');
    process.exit(1);
  }

  console.log(`📥 Reading ${file}...`);
  const rows = parseCsv(readFileSync(file, 'utf8'));
  console.log(`   ${rows.length} CSV rows`);

  const sql = postgres(process.env.DATABASE_URL!, { max: 4, prepare: false, idle_timeout: 30 });

  // ----- 1. Truncate orders + items, leave customers + products intact -----
  console.log('\n🗑️  Truncating orders + order_items + stock_movements...');
  await sql`TRUNCATE public.order_items, public.orders, public.stock_movements RESTART IDENTITY CASCADE`;
  console.log('   ✅ tables cleared');

  // ----- 2. Disable triggers that fire per-row (huge speedup) -----
  console.log('\n🔌 Disabling per-row triggers...');
  await sql`ALTER TABLE public.orders      DISABLE TRIGGER trg_orders_recompute`;
  await sql`ALTER TABLE public.order_items DISABLE TRIGGER trg_order_items_after`;
  await sql`ALTER TABLE public.orders      DISABLE TRIGGER trg_audit_orders`;
  await sql`ALTER TABLE public.order_items DISABLE TRIGGER trg_audit_orders`.catch(() => {});
  // The audit trigger on order_items doesn't exist (we only audit on tables in 0003_audit_triggers.sql whitelist)
  console.log('   ✅ triggers off');

  // ----- 3. Build customer + product lookup maps from existing rows -----
  console.log('\n🔍 Loading customer + product maps...');
  const customers =
    await sql<{ id: string; phone: string }[]>`SELECT id, phone FROM public.customers`;
  const products = await sql<{ id: string; sku: string }[]>`SELECT id, sku FROM public.products`;
  const customerByPhone = new Map(customers.map((c) => [c.phone, c.id]));
  const productBySku = new Map(products.map((p) => [p.sku, p.id]));
  console.log(`   ${customerByPhone.size} customers, ${productBySku.size} products`);

  // ----- 4. Build any missing customers/products from CSV -----
  const missingCustomers = new Map<string, string>(); // phone -> name
  const missingProducts = new Map<string, string>(); // sku -> name
  for (const r of rows) {
    const phone = normalisePhone(r.phone);
    if (phone && !customerByPhone.has(phone) && !missingCustomers.has(phone)) {
      missingCustomers.set(phone, r.customer_name || phone);
    }
    const sku = r.product_sku?.trim();
    if (sku && !productBySku.has(sku) && !missingProducts.has(sku)) {
      missingProducts.set(sku, (r.product_name || sku).trim());
    }
  }

  if (missingCustomers.size > 0) {
    console.log(`\n👥 Inserting ${missingCustomers.size} missing customers...`);
    const newCustomerRows = Array.from(missingCustomers, ([phone, name]) => ({ phone, name }));
    for (const batch of chunk(newCustomerRows, 500)) {
      const inserted = await sql<{ id: string; phone: string }[]>`
        INSERT INTO public.customers ${sql(batch, 'name', 'phone')}
        ON CONFLICT (phone) DO NOTHING
        RETURNING id, phone
      `;
      inserted.forEach((c) => customerByPhone.set(c.phone, c.id));
    }
    console.log(`   ✅ customers map size: ${customerByPhone.size}`);
  }

  if (missingProducts.size > 0) {
    console.log(`\n📦 Inserting ${missingProducts.size} missing products...`);
    const newProductRows = Array.from(missingProducts, ([sku, name]) => ({ sku, name }));
    for (const batch of chunk(newProductRows, 500)) {
      const inserted = await sql<{ id: string; sku: string }[]>`
        INSERT INTO public.products ${sql(batch, 'name', 'sku')}
        ON CONFLICT (sku) DO NOTHING
        RETURNING id, sku
      `;
      inserted.forEach((p) => productBySku.set(p.sku, p.id));
    }
    console.log(`   ✅ products map size: ${productBySku.size}`);
  }

  // ----- 5. Group rows by (date + phone) -----
  console.log('\n🧾 Grouping rows into orders...');
  type OrderGroup = {
    date: string;
    phone: string;
    deliveryMethod: string | null;
    location: string | null;
    notes: string | null;
    items: { sku: string; qty: number; unitPrice: number; unitCost: number }[];
  };
  const groups = new Map<string, OrderGroup>();
  for (const r of rows) {
    const phone = normalisePhone(r.phone);
    if (!phone || !r.date) continue;
    const key = `${r.date}|${phone}`;
    if (!groups.has(key)) {
      groups.set(key, {
        date: r.date,
        phone,
        deliveryMethod: r.delivery_method?.trim() || null,
        location: r.location?.trim() || null,
        notes: r.notes?.trim() || null,
        items: [],
      });
    }
    const g = groups.get(key)!;
    g.items.push({
      sku: r.product_sku.trim(),
      qty: parseInt(r.quantity, 10) || 1,
      unitPrice: parseFloat(r.unit_price ?? '0') || 0,
      unitCost: parseFloat(r.cost_price ?? '0') || 0,
    });
  }
  console.log(`   ${groups.size} unique orders, ${rows.length} items`);

  // ----- 6. Pre-compute order numbers (per-day sequence) -----
  console.log('\n🔢 Pre-computing order numbers...');
  const groupArr = Array.from(groups.values()).sort(
    (a, b) => a.date.localeCompare(b.date) || a.phone.localeCompare(b.phone),
  );
  const counterByDate = new Map<string, number>();
  type OrderInsert = {
    order_number: string;
    customer_id: string;
    order_date: string;
    delivery_method: string | null;
    delivery_location: string | null;
    notes: string | null;
    total_pieces: number;
    total_amount: string;
    status: 'confirmed';
  };
  const orderInserts: OrderInsert[] = [];
  const groupsWithIndex: { idx: number; group: OrderGroup }[] = [];
  let globalSeq = 0;
  for (const g of groupArr) {
    const customerId = customerByPhone.get(g.phone);
    if (!customerId) continue;
    globalSeq++;
    const datePart = g.date.replace(/-/g, '');
    const n = (counterByDate.get(g.date) ?? 0) + 1;
    counterByDate.set(g.date, n);
    // Append global sequence so collisions are mathematically impossible.
    const orderNumber = `ORD-${datePart}-${String(n).padStart(3, '0')}-${globalSeq}`;
    const totalPieces = g.items.reduce((s, it) => s + it.qty, 0);
    const totalAmount = g.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    orderInserts.push({
      order_number: orderNumber,
      customer_id: customerId,
      order_date: new Date(g.date).toISOString(),
      delivery_method: g.deliveryMethod,
      delivery_location: g.location,
      notes: g.notes,
      total_pieces: totalPieces,
      total_amount: totalAmount.toFixed(2),
      status: 'confirmed',
    });
    groupsWithIndex.push({ idx: orderInserts.length - 1, group: g });
  }
  console.log(`   ${orderInserts.length} orders ready to insert`);

  // Sanity check: order_number must be unique
  const seen = new Set<string>();
  let dupCount = 0;
  for (const o of orderInserts) {
    if (seen.has(o.order_number)) {
      dupCount++;
      if (dupCount <= 5) console.log(`   ⚠️  DUP: ${o.order_number}`);
    }
    seen.add(o.order_number);
  }
  if (dupCount > 0) {
    console.error(`   ❌ ${dupCount} duplicate order_numbers found in JS — aborting`);
    process.exit(1);
  }

  // ----- 7. Batch INSERT orders + capture IDs -----
  console.log('\n💾 Batch inserting orders (500/batch)...');
  const insertedOrderIds: string[] = [];
  let batchNo = 0;
  for (const batch of chunk(orderInserts, 500)) {
    batchNo++;
    const inserted = await sql<{ id: string }[]>`
      INSERT INTO public.orders ${sql(
        batch,
        'order_number',
        'customer_id',
        'order_date',
        'delivery_method',
        'delivery_location',
        'notes',
        'total_pieces',
        'total_amount',
        'status',
      )}
      RETURNING id
    `;
    inserted.forEach((r) => insertedOrderIds.push(r.id));
    process.stdout.write(`   batch ${batchNo} → ${insertedOrderIds.length}/${orderInserts.length}\r`);
  }
  console.log(`\n   ✅ ${insertedOrderIds.length} orders inserted`);

  // ----- 8. Build + batch INSERT order_items -----
  console.log('\n🛒 Building order_items rows...');
  type ItemInsert = {
    order_id: string;
    product_id: string;
    quantity: number;
    unit_price: string;
    unit_cost: string;
    subtotal: string;
    sort_order: number;
  };
  const itemInserts: ItemInsert[] = [];
  for (const { idx, group } of groupsWithIndex) {
    const orderId = insertedOrderIds[idx];
    if (!orderId) continue;
    group.items.forEach((it, k) => {
      const productId = productBySku.get(it.sku);
      if (!productId) return;
      itemInserts.push({
        order_id: orderId,
        product_id: productId,
        quantity: it.qty,
        unit_price: it.unitPrice.toFixed(2),
        unit_cost: it.unitCost.toFixed(2),
        subtotal: (it.qty * it.unitPrice).toFixed(2),
        sort_order: k,
      });
    });
  }
  console.log(`   ${itemInserts.length} items prepared`);

  console.log('\n💾 Batch inserting order_items (1000/batch)...');
  let inserted = 0;
  let itemBatchNo = 0;
  for (const batch of chunk(itemInserts, 1000)) {
    itemBatchNo++;
    await sql`
      INSERT INTO public.order_items ${sql(
        batch,
        'order_id',
        'product_id',
        'quantity',
        'unit_price',
        'unit_cost',
        'subtotal',
        'sort_order',
      )}
    `;
    inserted += batch.length;
    process.stdout.write(`   batch ${itemBatchNo} → ${inserted}/${itemInserts.length}\r`);
  }
  console.log(`\n   ✅ ${inserted} items inserted`);

  // ----- 9. Re-enable triggers -----
  console.log('\n🔌 Re-enabling triggers...');
  await sql`ALTER TABLE public.orders      ENABLE TRIGGER trg_orders_recompute`;
  await sql`ALTER TABLE public.order_items ENABLE TRIGGER trg_order_items_after`;
  await sql`ALTER TABLE public.orders      ENABLE TRIGGER trg_audit_orders`;
  console.log('   ✅ triggers restored');

  // ----- 10. One-shot recompute_customer_analytics for every customer -----
  console.log('\n🧮 Recomputing analytics for every customer...');
  await sql`
    DO $$
    DECLARE r record;
    BEGIN
      FOR r IN SELECT id FROM public.customers LOOP
        PERFORM public.recompute_customer_analytics(r.id);
      END LOOP;
    END $$
  `;
  console.log('   ✅ analytics recomputed');

  // ----- 11. Final report -----
  console.log('\n📊 Final counts:');
  const final = await sql<{ table: string; cnt: number }[]>`
    SELECT 'customers' AS "table", COUNT(*)::int AS cnt FROM public.customers
    UNION ALL SELECT 'orders',     COUNT(*)::int FROM public.orders
    UNION ALL SELECT 'order_items', COUNT(*)::int FROM public.order_items
    UNION ALL SELECT 'products',   COUNT(*)::int FROM public.products
  `;
  final.forEach((r) => console.log(`   ${r.table.padEnd(12)} ${r.cnt.toLocaleString('th-TH')}`));

  await sql.end();
  console.log('\n🎉 Done!');
}

main().catch((e) => {
  console.error('❌ migration failed:', e);
  process.exit(1);
});
