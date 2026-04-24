import { NextResponse, type NextRequest } from 'next/server';
import { isAuthorisedCron } from '@/lib/utils/cron-auth';
import { getTodaySnapshot, getTopProducts } from '@/lib/analytics/queries';
import { notify } from '@/lib/notify';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (!(await isAuthorisedCron(req))) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }

  const [snap, top] = await Promise.all([getTodaySnapshot(), getTopProducts(1, 3)]);

  const today = new Date().toLocaleDateString('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Bangkok',
  });

  const lines = [
    `📊 สรุปยอดวันนี้ (${today})`,
    `• ออเดอร์: ${snap.ordersToday.toLocaleString('th-TH')}`,
    `• ชิ้น: ${snap.piecesToday.toLocaleString('th-TH')}`,
    `• ยอดเงิน: ฿${snap.amountToday.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`,
    `• ลูกค้าใหม่: ${snap.newCustomersToday}`,
    `• ลูกค้าต้องตาม: ${snap.dueToContactCount}`,
    `• สต็อกใกล้หมด: ${snap.lowStockCount}`,
  ];

  if (top.length > 0) {
    lines.push('');
    lines.push('🏆 Top สินค้าวันนี้:');
    top.forEach((t, i) => lines.push(`  ${i + 1}. ${t.name} — ${t.pieces} ชิ้น`));
  }

  const text = lines.join('\n');
  const results = await notify(text);

  return NextResponse.json({ ok: true, sent: results, snapshot: snap });
}
