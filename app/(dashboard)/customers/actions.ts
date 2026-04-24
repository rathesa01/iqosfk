'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { customerInputSchema } from '@/lib/validations/customer';
import { requireUser } from '@/lib/utils/auth';

export type ActionState =
  | { ok: true; id?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | null;

export async function createCustomerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = customerInputSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    lineId: formData.get('lineId') || null,
    address: formData.get('address') || null,
    notes: formData.get('notes') || null,
    tags: (formData.get('tags') as string | null)
      ?.split(',')
      .map((t) => t.trim())
      .filter(Boolean) ?? [],
  });

  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const issue of parsed.error.issues) fe[String(issue.path[0])] = issue.message;
    return { ok: false, error: 'กรุณาตรวจสอบข้อมูล', fieldErrors: fe };
  }

  try {
    const [row] = await db
      .insert(customers)
      .values({ ...parsed.data, createdBy: user.id })
      .returning({ id: customers.id });

    revalidatePath('/customers');
    redirect(`/customers/${row!.id}`);
  } catch (err) {
    if (err instanceof Error && /redirect/i.test(err.message)) throw err;
    const msg = err instanceof Error ? err.message : 'unknown error';
    if (msg.includes('customers_phone_idx')) {
      return { ok: false, error: 'เบอร์นี้มีลูกค้าอยู่แล้ว' };
    }
    return { ok: false, error: msg };
  }
}

export async function updateCustomerAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();

  const parsed = customerInputSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    lineId: formData.get('lineId') || null,
    address: formData.get('address') || null,
    notes: formData.get('notes') || null,
    tags: (formData.get('tags') as string | null)
      ?.split(',')
      .map((t) => t.trim())
      .filter(Boolean) ?? [],
  });

  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const issue of parsed.error.issues) fe[String(issue.path[0])] = issue.message;
    return { ok: false, error: 'กรุณาตรวจสอบข้อมูล', fieldErrors: fe };
  }

  try {
    await db.update(customers).set(parsed.data).where(eq(customers.id, id));
    revalidatePath(`/customers/${id}`);
    revalidatePath('/customers');
    return { ok: true, id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    if (msg.includes('customers_phone_idx')) {
      return { ok: false, error: 'เบอร์นี้มีลูกค้าอื่นใช้อยู่แล้ว' };
    }
    return { ok: false, error: msg };
  }
}

export async function deleteCustomerAction(id: string) {
  await requireUser();
  await db.delete(customers).where(eq(customers.id, id));
  revalidatePath('/customers');
  redirect('/customers');
}
