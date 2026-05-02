import 'server-only';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';

export type NotifySettings = {
  lineToken?: string;
  lineTo?: string; // userId or groupId
  webhookUrl?: string;
};

export type CronSettings = {
  secret?: string; // shared secret for /api/cron/* endpoints
};

export type FinanceSettings = {
  startDate?: string; // ISO date YYYY-MM-DD — P&L counts only orders >= this date
};

export const DEFAULT_FINANCE_START = '2026-05-01';

const KEYS = {
  notify: 'notify',
  cron: 'cron',
  finance: 'finance',
} as const;

export async function readSetting<T>(key: string): Promise<T | null> {
  const rows = await db.execute<{ value: T }>(
    sql`SELECT value FROM public.settings WHERE key = ${key} LIMIT 1`,
  );
  return rows[0]?.value ?? null;
}

export async function writeSetting(key: string, value: unknown) {
  await db
    .insert(settings)
    .values({ key, value: value as object })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: value as object, updatedAt: new Date() },
    });
}

export async function getNotifySettings(): Promise<NotifySettings> {
  return (await readSetting<NotifySettings>(KEYS.notify)) ?? {};
}

export async function getCronSettings(): Promise<CronSettings> {
  return (await readSetting<CronSettings>(KEYS.cron)) ?? {};
}

export async function getFinanceSettings(): Promise<FinanceSettings> {
  const cfg = (await readSetting<FinanceSettings>(KEYS.finance)) ?? {};
  return { startDate: cfg.startDate ?? DEFAULT_FINANCE_START };
}

export const SETTINGS_KEYS = KEYS;
