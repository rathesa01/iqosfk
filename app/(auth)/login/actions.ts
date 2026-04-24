'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const loginSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องอย่างน้อย 6 ตัว'),
  next: z.string().optional(),
});

export type FieldErrors = Partial<Record<'email' | 'password', string>>;
export type LoginState = {
  error?: string;
  fieldErrors?: FieldErrors;
} | null;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next') ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === 'email' || key === 'password') fieldErrors[key] = issue.message;
    }
    return { error: 'กรุณาตรวจสอบข้อมูลที่กรอก', fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
  }

  revalidatePath('/', 'layout');
  redirect(parsed.data.next || '/');
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
