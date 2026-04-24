'use server';

import { revalidatePath } from 'next/cache';
import { sql } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/utils/auth-admin';

export type ActionState =
  | { ok: true; message?: string }
  | { ok: false; error: string }
  | null;

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/**
 * Create a user directly from the back-office.
 * No email confirmation step — user is auto-confirmed and can log in
 * immediately with the password the admin sets.
 */
export async function createUserAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const password = String(fd.get('password') ?? '');
  const fullName = String(fd.get('fullName') ?? '').trim();
  const role = String(fd.get('role') ?? 'staff') as 'admin' | 'staff' | 'viewer';

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: 'อีเมลไม่ถูกต้อง' };
  }
  if (!password || password.length < 6) {
    return { ok: false, error: 'รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร' };
  }
  if (!['admin', 'staff', 'viewer'].includes(role)) {
    return { ok: false, error: 'role ไม่ถูกต้อง' };
  }

  const sb = adminClient();
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || email, role },
  });
  if (error) {
    if (/already.*registered|exists/i.test(error.message)) {
      return { ok: false, error: 'อีเมลนี้มีผู้ใช้แล้ว' };
    }
    return { ok: false, error: error.message };
  }
  if (data.user) {
    await db.execute(sql`
      UPDATE public.profiles
         SET role = ${role}::public.user_role,
             full_name = ${fullName || email}
       WHERE id = ${data.user.id}
    `);
  }
  revalidatePath('/settings/users');
  return { ok: true, message: `สร้าง ${email} แล้ว — ใช้งานได้ทันที (ไม่ต้อง confirm email)` };
}

export async function changeRoleAction(userId: string, role: 'admin' | 'staff' | 'viewer') {
  await requireAdmin();
  await db.execute(sql`
    UPDATE public.profiles
       SET role = ${role}::public.user_role,
           updated_at = now()
     WHERE id = ${userId}
  `);
  revalidatePath('/settings/users');
}

export async function resetPasswordAction(userId: string, newPassword: string) {
  await requireAdmin();
  if (!newPassword || newPassword.length < 6) {
    throw new Error('รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร');
  }
  const sb = adminClient();
  const { error } = await sb.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) throw new Error(error.message);
  revalidatePath('/settings/users');
}

export async function deleteUserAction(userId: string) {
  await requireAdmin();
  const sb = adminClient();
  const { error } = await sb.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  revalidatePath('/settings/users');
}
