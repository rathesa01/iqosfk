'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { expenses } from '@/lib/db/schema';
import { expenseInputSchema } from '@/lib/validations/stock';
import { requireUser } from '@/lib/utils/auth';
import { requireAdmin } from '@/lib/utils/auth-admin';
import { writeSetting, SETTINGS_KEYS, getFinanceSettings } from '@/lib/settings';

export type ActionState =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | null;

export async function setFinanceStartAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const startDate = String(fd.get('startDate') ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return { ok: false, error: 'รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)' };
  }
  const cur = await getFinanceSettings();
  await writeSetting(SETTINGS_KEYS.finance, { ...cur, startDate });
  revalidatePath('/finance');
  return { ok: true, message: `บันทึกแล้ว — เริ่มนับ P&L ตั้งแต่ ${startDate}` };
}

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
