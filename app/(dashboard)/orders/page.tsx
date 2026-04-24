import Link from 'next/link';
import { desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { Plus, Search } from 'lucide-react';
import { db } from '@/lib/db';
import { customers, orders } from '@/lib/db/schema';
import { LinkButton } from '@/components/ui/link-button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatBkk } from '@/lib/utils/date';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ q?: string }>;

const STATUS_LABEL: Record<string, string> = {
  draft: 'ร่าง',
  confirmed: 'ยืนยันแล้ว',
  cancelled: 'ยกเลิก',
};
const STATUS_VARIANT: Record<string, 'secondary' | 'outline' | 'destructive'> = {
  draft: 'outline',
  confirmed: 'secondary',
  cancelled: 'destructive',
};

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams;
  const term = q?.trim();
  const where: SQL | undefined = term
    ? or(
        ilike(orders.orderNumber, `%${term}%`),
        ilike(customers.name, `%${term}%`),
        ilike(customers.phone, `%${term}%`),
      )
    : undefined;

  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      orderDate: orders.orderDate,
      status: orders.status,
      totalPieces: orders.totalPieces,
      totalAmount: orders.totalAmount,
      deliveryMethod: orders.deliveryMethod,
      customerName: customers.name,
      customerPhone: customers.phone,
    })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .where(where)
    .orderBy(desc(orders.orderDate))
    .limit(200);

  const [{ count = 0 } = { count: 0 }] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(orders);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">ออเดอร์</h1>
          <p className="text-muted-foreground text-sm">
            ทั้งหมด {count.toLocaleString('th-TH')} ออเดอร์
          </p>
        </div>
        <LinkButton href="/orders/new">
          <Plus className="mr-2 size-4" /> ออเดอร์ใหม่
        </LinkButton>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <form className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              name="q"
              defaultValue={term ?? ''}
              placeholder="ค้นหาเลขที่ / ชื่อลูกค้า / เบอร์…"
              className="pl-9"
            />
          </form>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead className="hidden md:table-cell">ส่ง</TableHead>
                  <TableHead className="text-right">ชิ้น</TableHead>
                  <TableHead className="text-right">ยอด</TableHead>
                  <TableHead>สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                      ยังไม่มีออเดอร์
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((o) => (
                  <TableRow key={o.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-xs">
                      <Link href={`/orders/${o.id}`} className="hover:underline">
                        {o.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatBkk(o.orderDate, 'd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{o.customerName}</div>
                      <div className="text-muted-foreground font-mono text-xs">
                        {o.customerPhone}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {o.deliveryMethod ?? '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{o.totalPieces}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      ฿{Number(o.totalAmount).toLocaleString('th-TH')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[o.status] ?? 'secondary'}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </Badge>
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
