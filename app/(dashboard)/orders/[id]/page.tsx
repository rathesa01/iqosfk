import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { customers, orderItems, orders, products } from '@/lib/db/schema';
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
import { deleteOrderAction } from '../actions';
import { formatBkk } from '@/lib/utils/date';

type Props = { params: Promise<{ id: string }> };

const STATUS_LABEL: Record<string, string> = {
  draft: 'ร่าง',
  confirmed: 'ยืนยันแล้ว',
  cancelled: 'ยกเลิก',
};

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  const [order] = await db
    .select({
      order: orders,
      customer: customers,
    })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .where(eq(orders.id, id))
    .limit(1);
  if (!order) notFound();

  const items = await db
    .select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      subtotal: orderItems.subtotal,
      productName: products.name,
      sku: products.sku,
    })
    .from(orderItems)
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(eq(orderItems.orderId, id))
    .orderBy(asc(orderItems.sortOrder));

  const o = order.order;
  const c = order.customer;
  const deleteBound = deleteOrderAction.bind(null, id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <LinkButton href="/orders" variant="ghost" size="sm">
          <ArrowLeft className="mr-1 size-4" /> กลับ
        </LinkButton>
        <form action={deleteBound}>
          <Button type="submit" variant="outline" className="text-destructive">
            ลบออเดอร์
          </Button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="font-mono text-base">{o.orderNumber}</CardTitle>
              <Badge variant="secondary">{STATUS_LABEL[o.status] ?? o.status}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">{formatBkk(o.orderDate, 'd MMM yyyy HH:mm')}</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>สินค้า</TableHead>
                  <TableHead className="text-right">ชิ้น</TableHead>
                  <TableHead className="text-right">ราคา/ชิ้น</TableHead>
                  <TableHead className="text-right">รวม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell>
                      <div className="font-medium">{it.productName}</div>
                      <div className="text-muted-foreground font-mono text-xs">{it.sku}</div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{it.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      ฿{Number(it.unitPrice).toLocaleString('th-TH')}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      ฿{Number(it.subtotal).toLocaleString('th-TH')}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-semibold">
                    รวมทั้งสิ้น
                  </TableCell>
                  <TableCell className="text-right text-lg font-bold tabular-nums">
                    ฿{Number(o.totalAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {o.notes && (
              <div className="bg-muted/40 mt-4 rounded-md p-3 text-sm">
                <div className="text-muted-foreground mb-1 text-xs">โน้ต</div>
                {o.notes}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ลูกค้า</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Link href={`/customers/${c.id}`} className="block font-medium hover:underline">
              {c.name}
            </Link>
            <div className="text-muted-foreground font-mono">{c.phone}</div>
            {c.lineId && <div>LINE: {c.lineId}</div>}

            <div className="border-t pt-3">
              <div className="text-muted-foreground mb-1 text-xs">การจัดส่ง</div>
              <div>{o.deliveryMethod ?? '—'}</div>
              {o.deliveryLocation && <div className="text-sm">{o.deliveryLocation}</div>}
              {o.trackingNumber && (
                <div className="text-muted-foreground font-mono text-xs">
                  Track: {o.trackingNumber}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
