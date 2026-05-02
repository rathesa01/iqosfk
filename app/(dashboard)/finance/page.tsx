import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PnlChart } from '@/components/charts/pnl-chart';
import { ExpenseQuickAdd } from './expense-quick-add';
import { DeleteExpenseButton } from './delete-expense-button';
import { CutoffForm } from './cutoff-form';
import { getPnl, listExpenses } from '@/lib/analytics/finance';
import { getFinanceSettings } from '@/lib/settings';
import { getCurrentProfile } from '@/lib/utils/auth';
import { formatBkk } from '@/lib/utils/date';

export const dynamic = 'force-dynamic';

const RANGE_OPTIONS = [
  { value: 'day-30', label: 'รายวัน · 30 วัน', granularity: 'day' as const, days: 30 },
  { value: 'day-90', label: 'รายวัน · 90 วัน', granularity: 'day' as const, days: 90 },
  { value: 'month-6', label: 'รายเดือน · 6 เดือน', granularity: 'month' as const, days: 31 * 6 },
  { value: 'month-12', label: 'รายเดือน · 12 เดือน', granularity: 'month' as const, days: 31 * 12 },
];

type SearchParams = Promise<{ range?: string }>;

export default async function FinancePage({ searchParams }: { searchParams: SearchParams }) {
  const { range: rangeKey } = await searchParams;
  const range = RANGE_OPTIONS.find((r) => r.value === rangeKey) ?? RANGE_OPTIONS[1]!;

  const [finCfg, profile, expenseList] = await Promise.all([
    getFinanceSettings(),
    getCurrentProfile(),
    listExpenses(50),
  ]);
  const cutoff = finCfg.startDate!;
  const isAdmin = profile?.role === 'admin';

  const pnl = await getPnl(range.granularity, range.days, cutoff);

  const totals = pnl.reduce(
    (acc, b) => ({
      revenue: acc.revenue + b.revenue,
      cogs: acc.cogs + b.cogs,
      grossProfit: acc.grossProfit + b.grossProfit,
      expenses: acc.expenses + b.expenses,
      netProfit: acc.netProfit + b.netProfit,
      orderCount: acc.orderCount + b.orderCount,
    }),
    { revenue: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0, orderCount: 0 },
  );
  const margin = totals.revenue > 0 ? (totals.netProfit / totals.revenue) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">กำไรขาดทุน (P&amp;L)</h1>
          <p className="text-muted-foreground text-sm">
            ทุนคำนวณจาก unit_cost ตอนขาย (snapshot) — ไม่ผันตามราคาทุนล่าสุด
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {RANGE_OPTIONS.map((r) => (
            <Link
              key={r.value}
              href={`?range=${r.value}`}
              className={
                r.value === range.value
                  ? 'bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-medium'
                  : 'border-border hover:bg-muted rounded-md border px-3 py-1.5 text-sm'
              }
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <CutoffForm current={cutoff} isAdmin={isAdmin} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="รายได้" value={`฿${totals.revenue.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`} />
        <Stat label="ทุน (COGS)" value={`฿${totals.cogs.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`} />
        <Stat label="ค่าใช้จ่ายอื่น" value={`฿${totals.expenses.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`} />
        <Stat
          label="กำไรสุทธิ"
          value={`฿${totals.netProfit.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`}
          hint={`มาร์จิ้น ${margin.toFixed(1)}%`}
          accent={totals.netProfit >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{range.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <PnlChart data={pnl} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ตาราง P&amp;L</CardTitle>
            <CardDescription>กำไรสุทธิ = รายได้ − ทุน − ค่าใช้จ่ายอื่น</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ช่วง</TableHead>
                    <TableHead className="text-right">ออเดอร์</TableHead>
                    <TableHead className="text-right">รายได้</TableHead>
                    <TableHead className="text-right">ทุน</TableHead>
                    <TableHead className="text-right">ค่าใช้จ่าย</TableHead>
                    <TableHead className="text-right">กำไรสุทธิ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pnl.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                        ยังไม่มีข้อมูล
                      </TableCell>
                    </TableRow>
                  )}
                  {pnl.map((b) => (
                    <TableRow key={b.bucket}>
                      <TableCell className="font-mono text-xs">{b.bucket}</TableCell>
                      <TableCell className="text-right tabular-nums">{b.orderCount}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        ฿{b.revenue.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right tabular-nums">
                        ฿{b.cogs.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right tabular-nums">
                        ฿{b.expenses.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums font-medium ${
                          b.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        ฿{b.netProfit.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ค่าใช้จ่าย</CardTitle>
            <CardDescription>เพิ่มรายการค่าส่ง / แพ็ค / โฆษณา ฯลฯ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ExpenseQuickAdd />
            <ul className="divide-y text-sm">
              {expenseList.length === 0 && (
                <li className="text-muted-foreground py-4 text-center">ยังไม่มีรายการ</li>
              )}
              {expenseList.map((e) => (
                <li key={e.id} className="flex items-center gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{e.category}</div>
                    <div className="text-muted-foreground text-xs">
                      {formatBkk(e.expenseDate, 'd MMM yyyy')}
                      {e.description ? ` · ${e.description}` : ''}
                    </div>
                  </div>
                  <div className="text-right font-medium tabular-nums">
                    ฿{e.amount.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
                  </div>
                  <DeleteExpenseButton id={e.id} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: 'positive' | 'negative';
}) {
  const cls =
    accent === 'positive'
      ? 'text-emerald-600'
      : accent === 'negative'
        ? 'text-rose-600'
        : '';
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-muted-foreground text-xs font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold tabular-nums ${cls}`}>{value}</div>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}
