'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { customerContacts } from '@/lib/db/schema';
import { requireUser } from '@/lib/utils/auth';
import { sql } from 'drizzle-orm';

export async function markAsContactedAction(customerId: string, channel: string, notes?: string) {
  const user = await requireUser();
  await db.insert(customerContacts).values({
    customerId,
    channel: (channel ?? 'line') as 'line' | 'phone' | 'email' | 'other',
    notes: notes ?? null,
    createdBy: user.id,
  });
  // Bump next_expected_date by avg_freq_days so the customer doesn't appear
  // in the "due" list again until the next cycle.
  await db.execute(sql`
    UPDATE public.customers
       SET next_expected_date = CASE
             WHEN avg_freq_days IS NOT NULL AND avg_freq_days > 0
               THEN now() + (avg_freq_days * INTERVAL '1 day')
             ELSE now() + INTERVAL '14 day'
           END,
           updated_at = now()
     WHERE id = ${customerId}
  `);
  revalidatePath('/');
  revalidatePath(`/customers/${customerId}`);
}

export async function snoozeContactAction(customerId: string, days: number) {
  await requireUser();
  await db.execute(sql`
    UPDATE public.customers
       SET next_expected_date = now() + (${days}::int * INTERVAL '1 day'),
           updated_at = now()
     WHERE id = ${customerId}
  `);
  revalidatePath('/');
}
