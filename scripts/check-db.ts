import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const tables = await sql<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `;
  console.log('📋 Public tables:');
  tables.forEach((t) => console.log('  •', t.tablename));

  const enums = await sql<{ typname: string }[]>`
    SELECT t.typname FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typtype = 'e' AND n.nspname = 'public'
    ORDER BY t.typname;
  `;
  console.log('\n🔤 Enums:');
  enums.forEach((e) => console.log('  •', e.typname));

  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
