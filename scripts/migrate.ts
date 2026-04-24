import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

config({ path: '.env.local' });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql);

  console.log('▶ running migrations…');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('✅ migrations applied');

  await sql.end();
}

main().catch((err) => {
  console.error('❌ migration failed:', err);
  process.exit(1);
});
