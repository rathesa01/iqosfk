'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { expenses } from '@/lib/db/schema';
import { expenseInputSchema } from '@/lib/validations/stock';
import { requireUser } from '@/lib/utils/auth';

export type ActionState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | null;

export async function createExpenseAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = expenseInputSchema.safeParse({
    expenseDate: fd.get('expenseDate'),
    category: fd.get('category'),
    amount: fd.get('amount'),
    description: fd.get('description') || null,
  });
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
    return { ok: false, error: 'กรุณาตรวจสอบข้อมูล', fieldErrors: fe };
  }
  await db.insert(expenses).values({
    expenseDate: parsed.data.expenseDate,
    category: parsed.data.category,
    amount: parsed.data.amount.toFixed(2),
    description: parsed.data.description ?? null,
    createdBy: user.id,
  });
  revalidatePath('/finance');
  return { ok: true };
}

export async function deleteExpenseAction(id: string) {
  await requireUser();
  await db.delete(expenses).where(eq(expenses.id, id));
  revalidatePath('/finance');
}
