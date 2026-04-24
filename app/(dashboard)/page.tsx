import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ClipboardList,
  Phone,
  Heart,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LinkButton } from '@/components/ui/link-button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SegmentBadge, StatusBadge } from '@/components/segment-badge';
import { formatBkk, nowBkk } from '@/lib/utils/date';
import {
  getDueCustomers,
  getRecentOrders,
  getTodaySnapshot,
} from '@/lib/analytics/queries';
import type { Segment, Status } from '@/lib/analytics/customer';
import { ContactedButton, SnoozeButton } from './due-actions';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [snapshot, dueList, recent] = await Promise.all([
    getTodaySnapshot(),
    getDueCustomers(20),
    getRecentOrders(8),
  ]);

  const monthDelta = snapshot.amountLastMonth
    ? ((snapshot.amountThisMonth - snapshot.amountLastMonth) / snapshot.amountLastMonth) * 100
    : null;
  const today = formatBkk(nowBkk(), 'EEEE d MMMM yyyy');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">สวัสดีค่ะ 👋</h1>
        <p className="text-muted-foreground text-sm">วันนี้ {today}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="ออเดอร์วันนี้"
          value={snapshot.ordersToday.toLocaleString('th-TH')}
          hint={`${snapshot.piecesToday.toLocaleString('th-TH')} ชิ้น · ฿${snapshot.amountToday.toLocaleString('th-TH', {
            maximumFractionDigits: 0,
          })}`}
          icon={ClipboardList}
        />
        <StatCard
          label="ลูกค้าใหม่วันนี้"
          value={snapshot.newCustomersToday.toLocaleString('th-TH')}
          hint=""
          icon={Heart}
        />
        <StatCard
          label="ต้องติดต่อ"
          value={snapshot.dueToContactCount.toLocaleString('th-TH')}
          hint="ตามรอบซื้อ"
          icon={Phone}
          highlight={snapshot.dueToContactCount > 0}
        />
        <StatCard
          label="สต็อกใกล้หมด"
          value={snapshot.lowStockCount.toLocaleString('th-TH')}
          hint="≤ จุดเตือน"
          icon={AlertTriangle}
          highlight={snapshot.lowStockCount > 0}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">เดือนนี้</CardTitle>
              <p className="text-muted-foreground text-xs">
                {snapshot.ordersThisMonth.toLocaleString('th-TH')} ออเดอร์
              </p>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold tabular-nums">
                ฿
                {snapshot.amountThisMonth.toLocaleString('th-TH', {
                  maximumFractionDigits: 0,
                })}
              </span>
              {monthDelta !== null && (
                <Badge
                  variant="secondary"
                  className={
                    monthDelta >= 0
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200'
                  }
                >
                  {monthDelta >= 0 ? (
                    <ArrowUpRight className="mr-0.5 size-3" />
                  ) : (
                    <ArrowDownRight className="mr-0.5 size-3" />
                  )}
                  {Math.abs(monthDelta).toFixed(1)}% vs เดือนที่แล้ว
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">🎯 ต้องติดต่อวันนี้</CardTitle>
              <p className="text-muted-foreground text-xs">
                เรียงตามวันที่ควรซื้อรอบถัดไป (overdue ก่อน)
              </p>
            </div>
            <LinkButton href="/customers" size="sm" variant="ghost">
              ดูทั้งหมด
            </LinkButton>
          </CardHeader>
          <CardContent className="px-0">
            {dueList.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                🎉 ไม่มีลูกค้าที่ต้องตามวันนี้
              </p>
            ) : (
              <ul className="divide-y">
                {dueList.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <Link href={`/customers/${c.id}`} className="font-medium hover:underline">
                        {c.name}
                      </Link>
                      <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono">{c.phone}</span>
                        <SegmentBadge segment={c.segment as Segment} />
                        <StatusBadge status={c.status as Status} />
                        <span>·</span>
                        <span>
                          ห่าง {c.daysSince ?? '—'} วัน ·{' '}
                          {c.daysOverdue >= 0 ? (
                            <span className="text-rose-600">
                              เลย {c.daysOverdue} วัน
                            </span>
                          ) : (
                            'พอดี'
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <ContactedButton customerId={c.id} />
                      <SnoozeButton customerId={c.id} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">🧾 ออเดอร์ล่าสุด</CardTitle>
            <LinkButton href="/orders" size="sm" variant="ghost">
              ดูทั้งหมด
            </LinkButton>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead className="text-right">ชิ้น</TableHead>
                  <TableHead className="text-right">ยอด</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground py-6 text-center text-sm">
                      ยังไม่มีออเดอร์
                    </TableCell>
                  </TableRow>
                )}
                {recent.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link href={`/orders/${o.id}`} className="font-medium hover:underline">
                        {o.customerName}
                      </Link>
                      <div className="text-muted-foreground font-mono text-xs">
                        {o.orderNumber}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{o.totalPieces}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      ฿{Number(o.totalAmount).toLocaleString('th-TH')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <TrendingUp className="text-primary size-5" />
          <div className="min-w-0 flex-1">
            <div className="font-medium">เปิดหน้าวิเคราะห์เต็มรูปแบบ</div>
            <p className="text-muted-foreground text-sm">
              กราฟยอดขาย, top products/customers, segment distribution, heatmap
            </p>
          </div>
          <LinkButton href="/analytics">เปิด Analytics →</LinkButton>
        </CardContent>
      </Card>
    </div>
  );
}

type StatProps = {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
};

function StatCard({ label, value, hint, icon: Icon, highlight }: StatProps) {
  return (
    <Card className={highlight ? 'border-amber-300 dark:border-amber-700' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-muted-foreground text-xs font-medium">{label}</CardTitle>
        <Icon className={highlight ? 'size-4 text-amber-600' : 'text-muted-foreground size-4'} />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}
