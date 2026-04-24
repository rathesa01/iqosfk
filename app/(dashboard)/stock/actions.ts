'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { purchaseItems, purchases, stockMovements } from '@/lib/db/schema';
import { purchaseInputSchema, stockAdjustmentSchema } from '@/lib/validations/stock';
import { requireUser } from '@/lib/utils/auth';

export type ActionState =
  | { ok: true; id?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | null;

function readItems(fd: FormData) {
  const raw = fd.get('items');
  if (typeof raw !== 'string' || raw.length === 0) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function createPurchaseAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = purchaseInputSchema.safeParse({
    purchaseDate: fd.get('purchaseDate'),
    supplier: fd.get('supplier') || null,
    notes: fd.get('notes') || null,
    items: readItems(fd),
  });
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
    return { ok: false, error: 'กรุณาตรวจสอบข้อมูล', fieldErrors: fe };
  }

  try {
    const id = await db.transaction(async (tx) => {
      const total = parsed.data.items.reduce((s, it) => s + it.quantity * it.costPerUnit, 0);

      const [p] = await tx
        .insert(purchases)
        .values({
          purchaseDate: parsed.data.purchaseDate,
          supplier: parsed.data.supplier ?? null,
          notes: parsed.data.notes ?? null,
          totalAmount: total.toFixed(2),
          createdBy: user.id,
        })
        .returning({ id: purchases.id });

      const purchaseId = p!.id;

      await tx.insert(purchaseItems).values(
        parsed.data.items.map((it) => ({
          purchaseId,
          productId: it.productId,
          quantity: it.quantity,
          costPerUnit: it.costPerUnit.toFixed(2),
          subtotal: (it.quantity * it.costPerUnit).toFixed(2),
        })),
      );

      // Create stock-in movements (trigger updates products.current_stock)
      for (const it of parsed.data.items) {
        await tx.insert(stockMovements).values({
          productId: it.productId,
          movementType: 'in',
          quantity: it.quantity,
          referenceType: 'purchase',
          referenceId: purchaseId,
          costPerUnit: it.costPerUnit.toFixed(2),
          notes: parsed.data.notes ?? null,
          createdBy: user.id,
        });
      }
      return purchaseId;
    });

    revalidatePath('/stock');
    revalidatePath('/products');
    redirect(`/stock?ok=${id}`);
  } catch (err) {
    if (err instanceof Error && /redirect/i.test(err.message)) throw err;
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
  }
}

export async function adjustStockAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = stockAdjustmentSchema.safeParse({
    productId: fd.get('productId'),
    delta: fd.get('delta'),
    notes: fd.get('notes') || null,
  });
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
    return { ok: false, error: 'กรุณาตรวจสอบข้อมูล', fieldErrors: fe };
  }
  await db.insert(stockMovements).values({
    productId: parsed.data.productId,
    movementType: 'adjustment',
    quantity: parsed.data.delta,
    referenceType: 'manual_adjust',
    notes: parsed.data.notes ?? null,
    createdBy: user.id,
  });
  revalidatePath('/stock');
  revalidatePath('/products');
  return { ok: true };
}

export async function searchProductsLite(q: string) {
  await requireUser();
  const term = `%${q.trim()}%`;
  return await db.execute<{
    id: string;
    sku: string;
    name: string;
    costPrice: string;
    currentStock: number;
  }>(sql`
    SELECT id, sku, name, cost_price::text AS "costPrice", current_stock AS "currentStock"
      FROM public.products
     WHERE (name ILIKE ${term} OR sku ILIKE ${term}) AND is_active
     ORDER BY name
     LIMIT 20
  `);
}
