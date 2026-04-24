'use server';

import { revalidatePath } from 'next/cache';
import { writeSetting, SETTINGS_KEYS } from '@/lib/settings';
import { notify } from '@/lib/notify';
import { requireUser } from '@/lib/utils/auth';
import { randomBytes } from 'node:crypto';

export type ActionState =
  | { ok: true; message?: string }
  | { ok: false; error: string }
  | null;

export async function saveNotifySettingsAction(
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  await requireUser();
  const cfg = {
    lineToken: ((fd.get('lineToken') as string) || '').trim() || undefined,
    lineTo: ((fd.get('lineTo') as string) || '').trim() || undefined,
    webhookUrl: ((fd.get('webhookUrl') as string) || '').trim() || undefined,
  };
  await writeSetting(SETTINGS_KEYS.notify, cfg);
  revalidatePath('/settings/notifications');
  return { ok: true, message: 'บันทึกแล้ว' };
}

export async function testNotifyAction(_prev: ActionState): Promise<ActionState> {
  await requireUser();
  const results = await notify(
    `🧪 Test notification จาก IQOS CRM\nเวลา ${new Date().toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
    })}`,
  );
  if (results.length === 0) {
    return { ok: false, error: 'ยังไม่ได้ตั้งค่า channel ใดๆ' };
  }
  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    return {
      ok: false,
      error: failed.map((f) => `${f.channel}: ${f.error ?? 'fail'}`).join(' · '),
    };
  }
  return { ok: true, message: `ส่งสำเร็จ ${results.length} ช่อง: ${results.map((r) => r.channel).join(', ')}` };
}

export async function rotateCronSecretAction(): Promise<ActionState> {
  await requireUser();
  const secret = randomBytes(24).toString('base64url');
  await writeSetting(SETTINGS_KEYS.cron, { secret });
  revalidatePath('/settings/notifications');
  return { ok: true, message: `Cron secret ใหม่ถูกสร้างแล้ว — แสดงด้านล่าง` };
}
