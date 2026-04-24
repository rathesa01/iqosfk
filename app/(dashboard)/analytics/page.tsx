import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getDailySales,
  getHeatmap,
  getSegmentDistribution,
  getStatusDistribution,
  getTopCustomers,
  getTopProducts,
} from '@/lib/analytics/queries';
import {
  SEGMENT_LABEL_TH,
  STATUS_LABEL_TH,
  type Segment,
  type Status,
} from '@/lib/analytics/customer';
import { SegmentBadge } from '@/components/segment-badge';
import { SalesLineChart } from '@/components/charts/sales-line-chart';
import { TopProductsChart } from '@/components/charts/top-products-chart';
import { DistributionChart } from '@/components/charts/distribution-chart';
import { Heatmap } from '@/components/charts/heatmap';
import { formatBkk } from '@/lib/utils/date';

export const dynamic = 'force-dynamic';

const RANGE_OPTIONS = [
  { value: 7, label: '7 วัน' },
  { value: 30, label: '30 วัน' },
  { value: 60, label: '60 วัน' },
  { value: 90, label: '90 วัน' },
];

const SEGMENT_COLOR: Record<Segment, string> = {
  platinum: '#a855f7',
  gold: '#f59e0b',
  regular: '#3b82f6',
  returning: '#10b981',
  onetime: '#a1a1aa',
};

const STATUS_COLOR: Record<Status, string> = {
  active: '#10b981',
  cooling: '#eab308',
  cold: '#f97316',
  lost: '#f43f5e',
  dead: '#71717a',
};

type SearchParams = Promise<{ days?: string }>;

export default async function AnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  const { days: daysParam } = await searchParams;
  const days = Math.min(180, Math.max(7, Number(daysParam) || 30));

  const [daily, topProducts, topCustomers, segmentDist, statusDist, heat] = await Promise.all([
    getDailySales(days),
    getTopProducts(days, 10),
    getTopCustomers(10),
    getSegmentDistribution(),
    getStatusDistribution(),
    getHeatmap(8),
  ]);

  const totalAmount = daily.reduce((s, r) => s + r.amount, 0);
  const totalPieces = daily.reduce((s, r) => s + r.pieces, 0);
  const totalOrders = daily.reduce((s, r) => s + r.orderCount, 0);
  const totalNew = daily.reduce((s, r) => s + r.newCustomers, 0);

  const segChart = segmentDist.map((d) => ({
    key: d.key,
    count: d.count,
    label: SEGMENT_LABEL_TH[d.key as Segment] ?? d.key,
    color: SEGMENT_COLOR[d.key as Segment] ?? '#999',
  }));
  const statusChart = statusDist.map((d) => ({
    key: d.key,
    count: d.count,
    label: STATUS_LABEL_TH[d.key as Status] ?? d.key,
    color: STATUS_COLOR[d.key as Status] ?? '#999',
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm">
            ข้อมูลในช่วง {days} วันล่าสุด · ปรับช่วงด้านขวา
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {RANGE_OPTIONS.map((r) => (
            <Link
              key={r.value}
              href={`?days=${r.value}`}
              className={
                r.value === days
                  ? 'bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-medium'
                  : 'border-border hover:bg-muted rounded-md border px-3 py-1.5 text-sm'
              }
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="ยอดขายรวม" value={`฿${totalAmount.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`} />
        <Stat label="ออเดอร์รวม" value={totalOrders.toLocaleString('th-TH')} />
        <Stat label="ชิ้นรวม" value={totalPieces.toLocaleString('th-TH')} />
        <Stat label="ลูกค้าใหม่" value={totalNew.toLocaleString('th-TH')} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ยอดขายรายวัน</CardTitle>
          <CardDescription>
            พื้นที่สีแสดงยอดเงิน · เส้นคือจำนวนออเดอร์และลูกค้าใหม่
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalesLineChart data={daily} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 สินค้าขายดี ({days} วัน)</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">ยังไม่มีข้อมูล</p>
            ) : (
              <TopProductsChart
                data={topProducts.map((p) => ({
                  name: p.name,
                  pieces: p.pieces,
                  amount: p.amount,
                }))}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">🏆 Top 10 ลูกค้า VIP (ทั้งชีวิต)</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead className="text-right">ออเดอร์</TableHead>
                  <TableHead className="text-right">ชิ้น</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground py-8 text-center text-sm">
                      ยังไม่มีข้อมูล
                    </TableCell>
                  </TableRow>
                )}
                {topCustomers.map((c, i) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/customers/${c.id}`} className="font-medium hover:underline">
                        <Badge variant="outline" className="mr-1.5 px-1 font-mono">
                          {i + 1}
                        </Badge>
                        {c.name}
                      </Link>
                      <div className="text-muted-foreground font-mono text-xs">
                        {c.phone}
                        {c.lastOrderDate && ` · ล่าสุด ${formatBkk(c.lastOrderDate, 'd MMM')}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <SegmentBadge segment={c.segment as Segment} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{c.totalOrders}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.totalPieces}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Segment ลูกค้า</CardTitle>
            <CardDescription>สัดส่วนลูกค้าตามจำนวนออเดอร์</CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionChart data={segChart} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">สถานะลูกค้า</CardTitle>
            <CardDescription>นับจากจำนวนวันที่ห่างจากการซื้อล่าสุด</CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionChart data={statusChart} donut />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">🔥 ขายดีวันไหนของสัปดาห์ (8 สัปดาห์ล่าสุด)</CardTitle>
          <CardDescription>เข้มกว่า = ขายเยอะกว่า · hover เพื่อดูตัวเลข</CardDescription>
        </CardHeader>
        <CardContent>
          <Heatmap data={heat} />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-muted-foreground text-xs font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
