import 'server-only';
import { redirect } from 'next/navigation';
import { sql } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export type AdminContext = { userId: string; email: string };

export async function requireAdmin(): Promise<AdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const rows = await db.execute<{ role: string }>(
    sql`SELECT role::text AS role FROM public.profiles WHERE id = ${user.id} LIMIT 1`,
  );
  const role = rows[0]?.role;
  if (role !== 'admin') {
    redirect('/?denied=admin');
  }
  return { userId: user.id, email: user.email ?? '' };
}
