'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { categories, products } from '@/lib/db/schema';
import { categoryInputSchema, productInputSchema } from '@/lib/validations/product';
import { requireUser } from '@/lib/utils/auth';

export type ActionState =
  | { ok: true; id?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | null;

/* -------------------- Categories -------------------- */

export async function createCategoryAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = categoryInputSchema.safeParse({
    name: fd.get('name'),
    parentId: fd.get('parentId') || null,
    sortOrder: Number(fd.get('sortOrder') ?? 0),
    isActive: fd.get('isActive') !== 'false',
  });
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
    return { ok: false, error: 'กรุณาตรวจสอบข้อมูล', fieldErrors: fe };
  }
  await db.insert(categories).values(parsed.data);
  revalidatePath('/products');
  return { ok: true };
}

export async function deleteCategoryAction(id: string) {
  await requireUser();
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath('/products');
}

/* -------------------- Products -------------------- */

export async function createProductAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = productInputSchema.safeParse({
    sku: fd.get('sku'),
    name: fd.get('name'),
    categoryId: fd.get('categoryId') || null,
    costPrice: fd.get('costPrice') ?? 0,
    sellPrice: fd.get('sellPrice') ?? 0,
    lowStockThreshold: fd.get('lowStockThreshold') ?? 10,
    isActive: fd.get('isActive') !== 'false',
  });
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
    return { ok: false, error: 'กรุณาตรวจสอบข้อมูล', fieldErrors: fe };
  }

  try {
    const [row] = await db
      .insert(products)
      .values({
        ...parsed.data,
        costPrice: parsed.data.costPrice.toFixed(2),
        sellPrice: parsed.data.sellPrice.toFixed(2),
      })
      .returning({ id: products.id });
    revalidatePath('/products');
    redirect(`/products/${row!.id}`);
  } catch (err) {
    if (err instanceof Error && /redirect/i.test(err.message)) throw err;
    const msg = err instanceof Error ? err.message : 'unknown error';
    if (msg.includes('products_sku_idx')) return { ok: false, error: 'SKU นี้มีแล้ว' };
    return { ok: false, error: msg };
  }
}

export async function updateProductAction(
  id: string,
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  await requireUser();
  const parsed = productInputSchema.safeParse({
    sku: fd.get('sku'),
    name: fd.get('name'),
    categoryId: fd.get('categoryId') || null,
    costPrice: fd.get('costPrice') ?? 0,
    sellPrice: fd.get('sellPrice') ?? 0,
    lowStockThreshold: fd.get('lowStockThreshold') ?? 10,
    isActive: fd.get('isActive') !== 'false',
  });
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
    return { ok: false, error: 'กรุณาตรวจสอบข้อมูล', fieldErrors: fe };
  }

  try {
    await db
      .update(products)
      .set({
        ...parsed.data,
        costPrice: parsed.data.costPrice.toFixed(2),
        sellPrice: parsed.data.sellPrice.toFixed(2),
      })
      .where(eq(products.id, id));
    revalidatePath(`/products/${id}`);
    revalidatePath('/products');
    return { ok: true, id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    return { ok: false, error: msg };
  }
}

export async function deleteProductAction(id: string) {
  await requireUser();
  await db.delete(products).where(eq(products.id, id));
  revalidatePath('/products');
  redirect('/products');
}
