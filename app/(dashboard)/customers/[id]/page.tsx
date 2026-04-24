import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq, desc } from 'drizzle-orm';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { db } from '@/lib/db';
import { customers, orders } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { CustomerForm } from '../customer-form';
import { updateCustomerAction, deleteCustomerAction } from '../actions';
import { SegmentBadge, StatusBadge } from '@/components/segment-badge';
import { formatBkk } from '@/lib/utils/date';

type Props = { params: Promise<{ id: string }> };

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;
  const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!customer) notFound();

  const recentOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, id))
    .orderBy(desc(orders.orderDate))
    .limit(20);

  const updateBound = updateCustomerAction.bind(null, id);
  const deleteBound = deleteCustomerAction.bind(null, id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <LinkButton href="/customers" variant="ghost" size="sm">
          <ArrowLeft className="mr-1 size-4" /> กลับไปหน้าลูกค้า
        </LinkButton>
        <form action={deleteBound}>
          <Button
            type="submit"
            variant="outline"
            className="text-destructive hover:text-destructive"
          >
            ลบลูกค้า
          </Button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{customer.name}</CardTitle>
              <SegmentBadge segment={customer.segment} />
              <StatusBadge status={customer.status} />
            </div>
            <p className="text-muted-foreground font-mono text-sm">{customer.phone}</p>
          </CardHeader>
          <CardContent>
            <CustomerForm
              initial={customer}
              action={updateBound}
              submitLabel="บันทึกการแก้ไข"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">สรุป</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="ออเดอร์ทั้งหมด" value={customer.totalOrders.toString()} />
            <Row label="ชิ้นสะสม" value={customer.totalPieces.toLocaleString('th-TH')} />
            <Row
              label="ความถี่เฉลี่ย"
              value={customer.avgFreqDays ? `${customer.avgFreqDays} วัน` : '—'}
            />
            <Row
              label="ซื้อล่าสุด"
              value={
                customer.lastOrderDate ? formatBkk(customer.lastOrderDate, 'd MMM yyyy') : '—'
              }
            />
            <Row
              label="คาดว่าจะซื้อรอบถัดไป"
              value={
                customer.nextExpectedDate
                  ? formatBkk(customer.nextExpectedDate, 'd MMM yyyy')
                  : '—'
              }
            />
            {customer.tags && customer.tags.length > 0 && (
              <div>
                <div className="text-muted-foreground mb-1 text-xs">Tags</div>
                <div className="flex flex-wrap gap-1">
                  {customer.tags.map((t) => (
                    <Badge key={t} variant="outline">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">ประวัติออเดอร์ ({recentOrders.length} ล่าสุด)</CardTitle>
          <LinkButton href={`/orders/new?customerId=${customer.id}`} size="sm" variant="secondary">
            + ออเดอร์ใหม่
          </LinkButton>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead className="text-right">ชิ้น</TableHead>
                  <TableHead className="text-right">ยอดเงิน</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                      ยังไม่มีออเดอร์
                    </TableCell>
                  </TableRow>
                )}
                {recentOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono">{o.orderNumber}</TableCell>
                    <TableCell>{formatBkk(o.orderDate, 'd MMM yyyy')}</TableCell>
                    <TableCell className="text-right tabular-nums">{o.totalPieces}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      ฿{Number(o.totalAmount).toLocaleString('th-TH')}
                    </TableCell>
                    <TableCell className="text-right">
                      <LinkButton href={`/orders/${o.id}`} variant="ghost" size="sm" aria-label="เปิด">
                        <ExternalLink className="size-4" />
                      </LinkButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
