import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Lazy DB client.
 *
 * postgres-js connects on first query, not on init, so we can safely
 * pass a placeholder URL during build (when DATABASE_URL is not yet
 * set on Vercel). Any actual query will throw a clear connection
 * error if the URL is wrong/missing — but module import won't break
 * `next build`.
 */
const queryClient = postgres(
  process.env.DATABASE_URL ?? 'postgres://placeholder@localhost:5432/build_only',
  {
    prepare: false,
    max: 10,
    idle_timeout: 20,
  },
);

export const db = drizzle(queryClient, { schema, casing: 'snake_case' });
export { schema };
