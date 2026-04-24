import { NextResponse, type NextRequest } from 'next/server';
import { isAuthorisedCron } from '@/lib/utils/cron-auth';
import { getDueCustomers } from '@/lib/analytics/queries';
import { notify } from '@/lib/notify';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (!(await isAuthorisedCron(req))) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }

  const due = await getDueCustomers(20);
  if (due.length === 0) {
    return NextResponse.json({ ok: true, sent: [], dueCount: 0 });
  }

  const lines = [
    `📞 ลูกค้าที่ต้องตามวันนี้ (${due.length} ราย)`,
    '',
    ...due.slice(0, 15).map((c, i) => {
      const overdue = c.daysOverdue >= 0 ? ` · เลย ${c.daysOverdue}d` : '';
      return `${i + 1}. ${c.name} (${c.phone})${overdue}`;
    }),
  ];

  if (due.length > 15) {
    lines.push(`... และอีก ${due.length - 15} ราย`);
  }

  const results = await notify(lines.join('\n'));

  return NextResponse.json({ ok: true, sent: results, dueCount: due.length });
}
