import { ArrowLeft, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LinkButton } from '@/components/ui/link-button';

const EXPORTS = [
  {
    href: '/api/export/orders.csv?days=30',
    title: 'ออเดอร์ 30 วันล่าสุด',
    desc: 'ทุกออเดอร์ในช่วง 30 วัน รวม customer + delivery + amount',
  },
  {
    href: '/api/export/orders.csv?days=90',
    title: 'ออเดอร์ 90 วันล่าสุด',
    desc: 'ทุกออเดอร์ในช่วง 90 วัน',
  },
  {
    href: '/api/export/orders.csv?days=365',
    title: 'ออเดอร์ 1 ปีล่าสุด',
    desc: 'ทุกออเดอร์ในช่วง 365 วัน (ระวังไฟล์ใหญ่)',
  },
  {
    href: '/api/export/customers.csv',
    title: 'ลูกค้าทั้งหมด',
    desc: 'รายชื่อลูกค้า + analytics (segment / status / freq / next expected)',
  },
  {
    href: '/api/export/pnl.csv?granularity=day&days=90',
    title: 'P&L รายวัน · 90 วัน',
    desc: 'Revenue, COGS, Expenses, Net Profit ต่อวัน',
  },
  {
    href: '/api/export/pnl.csv?granularity=month&days=365',
    title: 'P&L รายเดือน · 12 เดือน',
    desc: 'Revenue, COGS, Expenses, Net Profit ต่อเดือน',
  },
];

export default function ExportsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <LinkButton href="/settings" variant="ghost" size="sm">
        <ArrowLeft className="mr-1 size-4" /> กลับ
      </LinkButton>

      <Card>
        <CardHeader>
          <CardTitle>Export ข้อมูล (CSV)</CardTitle>
          <CardDescription>
            ทุกไฟล์เป็น UTF-8 + BOM — เปิดด้วย Excel ภาษาไทยได้เลย
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {EXPORTS.map((e) => (
            <a
              key={e.href}
              href={e.href}
              className="hover:bg-muted/30 flex flex-col gap-1 rounded-md border p-3 transition-colors"
            >
              <div className="flex items-center gap-2 font-medium">
                <Download className="size-4" />
                {e.title}
              </div>
              <p className="text-muted-foreground text-xs">{e.desc}</p>
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
