import 'server-only';
import { type NextRequest } from 'next/server';
import { getCronSettings } from '@/lib/settings';

/**
 * Verify a cron request is authenticated by Vercel Cron OR by a manual
 * `?secret=...` query parameter. Both must match the secret stored in
 * settings (preferred) or the CRON_SECRET env var.
 */
export async function isAuthorisedCron(req: NextRequest): Promise<boolean> {
  const cfg = await getCronSettings();
  const expected = cfg.secret ?? process.env.CRON_SECRET;
  if (!expected) return false;

  const auth = req.headers.get('authorization') ?? '';
  if (auth.startsWith('Bearer ') && auth.slice(7) === expected) return true;

  const qs = req.nextUrl.searchParams.get('secret');
  if (qs && qs === expected) return true;

  return false;
}
