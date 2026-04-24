'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orderItems, orders, products } from '@/lib/db/schema';
import { orderInputSchema } from '@/lib/validations/order';
import { requireUser } from '@/lib/utils/auth';

export type ActionState =
  | { ok: true; id?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | null;

function parsePayload(fd: FormData) {
  const itemsJson = fd.get('items');
  let items: unknown = [];
  if (typeof itemsJson === 'string' && itemsJson.length > 0) {
    try {
      items = JSON.parse(itemsJson);
    } catch {
      items = [];
    }
  }
  return {
    customerId: fd.get('customerId'),
    orderDate: fd.get('orderDate'),
    deliveryMethod: fd.get('deliveryMethod') || null,
    deliveryLocation: fd.get('deliveryLocation') || null,
    trackingNumber: fd.get('trackingNumber') || null,
    deliveryStatus: (fd.get('deliveryStatus') as string) || 'pending',
    status: (fd.get('status') as string) || 'confirmed',
    notes: fd.get('notes') || null,
    items,
  };
}

export async function createOrderAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = orderInputSchema.safeParse(parsePayload(fd));
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
    return { ok: false, error: 'กรุณาตรวจสอบข้อมูล', fieldErrors: fe };
  }

  try {
    const orderId = await db.transaction(async (tx) => {
      const [{ orderNumber }] = await tx.execute<{ orderNumber: string }>(
        sql`SELECT public.generate_order_number()::text AS "orderNumber"`,
      );

      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber,
          customerId: parsed.data.customerId,
          orderDate: parsed.data.orderDate,
          deliveryMethod: parsed.data.deliveryMethod ?? null,
          deliveryLocation: parsed.data.deliveryLocation ?? null,
          trackingNumber: parsed.data.trackingNumber ?? null,
          deliveryStatus: parsed.data.deliveryStatus,
          status: parsed.data.status,
          notes: parsed.data.notes ?? null,
          createdBy: user.id,
        })
        .returning({ id: orders.id });

      const id = order!.id;

      await tx.insert(orderItems).values(
        parsed.data.items.map((it, idx) => ({
          orderId: id,
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice.toFixed(2),
          unitCost: it.unitCost.toFixed(2),
          subtotal: (it.unitPrice * it.quantity).toFixed(2),
          sortOrder: idx,
        })),
      );

      // Sync stock-out movement (only when order is confirmed).
      if (parsed.data.status === 'confirmed') {
        for (const it of parsed.data.items) {
          await tx.execute(sql`
            INSERT INTO public.stock_movements
              (product_id, movement_type, quantity, reference_type, reference_id, cost_per_unit, created_by)
            VALUES
              (${it.productId}, 'out', ${it.quantity}, 'sale', ${id}, ${it.unitCost.toFixed(2)}, ${user.id})
          `);
        }
      }
      return id;
    });

    revalidatePath('/orders');
    revalidatePath('/customers');
    redirect(`/orders/${orderId}`);
  } catch (err) {
    if (err instanceof Error && /redirect/i.test(err.message)) throw err;
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
  }
}

export async function deleteOrderAction(id: string) {
  await requireUser();
  // Reverse stock movements before deletion.
  const items = await db
    .select({ productId: orderItems.productId, qty: orderItems.quantity })
    .from(orderItems)
    .where(eq(orderItems.orderId, id));

  for (const it of items) {
    await db.execute(sql`
      INSERT INTO public.stock_movements
        (product_id, movement_type, quantity, reference_type, reference_id, notes)
      VALUES (${it.productId}, 'in', ${it.qty}, 'sale_reversal', ${id}, 'auto-reversal on order delete')
    `);
  }

  await db.delete(orders).where(eq(orders.id, id));
  revalidatePath('/orders');
  revalidatePath('/customers');
  redirect('/orders');
}

export async function searchCustomersForOrder(q: string) {
  await requireUser();
  const term = `%${q.trim()}%`;
  return await db.execute<{
    id: string;
    name: string;
    phone: string;
  }>(sql`
    SELECT id, name, phone
      FROM public.customers
     WHERE name ILIKE ${term} OR phone ILIKE ${term}
     ORDER BY name
     LIMIT 20
  `);
}

export async function searchProductsForOrder(q: string) {
  await requireUser();
  const term = `%${q.trim()}%`;
  return await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      sellPrice: products.sellPrice,
      costPrice: products.costPrice,
      currentStock: products.currentStock,
    })
    .from(products)
    .where(sql`(${products.name} ILIKE ${term} OR ${products.sku} ILIKE ${term}) AND ${products.isActive}`)
    .limit(20);
}
