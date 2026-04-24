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

export async function inviteUserAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const email = String(fd.get('email') ?? '').trim();
  const fullName = String(fd.get('fullName') ?? '').trim();
  const role = String(fd.get('role') ?? 'staff') as 'admin' | 'staff' | 'viewer';

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: 'อีเมลไม่ถูกต้อง' };
  }
  if (!['admin', 'staff', 'viewer'].includes(role)) {
    return { ok: false, error: 'role ไม่ถูกต้อง' };
  }

  const sb = adminClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/login`;

  const { data, error } = await sb.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName || email, role },
    redirectTo,
  });
  if (error) {
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
  return { ok: true, message: `เชิญ ${email} แล้ว — ตรวจ inbox เพื่อ confirm` };
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

export async function deleteUserAction(userId: string) {
  await requireAdmin();
  const sb = adminClient();
  const { error } = await sb.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  revalidatePath('/settings/users');
}
