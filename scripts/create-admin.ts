/**
 * Bootstrap an admin user.
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts <email> <password> [fullName]
 *
 * Uses the Supabase service role key to create a confirmed user
 * and promote them to the `admin` role in `public.profiles`.
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

config({ path: '.env.local' });

async function main() {
  const [, , email, password, fullName] = process.argv;
  if (!email || !password) {
    console.error('Usage: tsx scripts/create-admin.ts <email> <password> [fullName]');
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  const dbUrl = process.env.DATABASE_URL;

  if (!url || !serviceKey || !dbUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY / DATABASE_URL');
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`▶ creating user ${email}…`);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName ?? email, role: 'admin' },
  });

  if (error) {
    console.error('❌ create failed:', error.message);
    process.exit(1);
  }

  const userId = data.user!.id;
  console.log(`✅ user created: ${userId}`);

  // Trigger should have auto-created profile, but force role to admin.
  const sql = postgres(dbUrl, { max: 1 });
  await sql`
    UPDATE public.profiles
       SET role = 'admin', full_name = COALESCE(${fullName ?? null}, full_name)
     WHERE id = ${userId};
  `;
  await sql.end();

  console.log('✅ profile promoted to admin');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
