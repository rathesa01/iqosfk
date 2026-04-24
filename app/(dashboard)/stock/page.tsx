import { asc, desc, eq, sql } from 'drizzle-orm';
import { AlertTriangle, ArrowDownToLine, Package, History } from 'lucide-react';
import { db } from '@/lib/db';
import { categories, products, stockMovements } from '@/lib/db/schema';
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
import { AdjustStockButton } from './adjust-stock-button';

export const dynamic = 'force-dynamic';

export default async function StockPage() {
  const stockRows = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      categoryName: categories.name,
      currentStock: products.currentStock,
      lowStockThreshold: products.lowStockThreshold,
      costPrice: products.costPrice,
      isActive: products.isActive,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.isActive), asc(products.name));

  const lowCount = stockRows.filter((p) => p.isActive && p.currentStock <= p.lowStockThreshold).length;
  const totalValue = stockRows.reduce(
    (s, p) => s + Number(p.costPrice) * Math.max(0, p.currentStock),
    0,
  );

  const movements = await db.execute<{
    id: string;
    movementType: string;
    quantity: number;
    productName: string;
    referenceType: string | null;
    notes: string | null;
    createdAt: Date;
  }>(sql`
    SELECT m.id, m.movement_type AS "movementType", m.quantity,
           p.name AS "productName", m.reference_type AS "referenceType",
           m.notes, m.created_at AS "createdAt"
      FROM public.stock_movements m
      JOIN public.products p ON p.id = m.product_id
     ORDER BY m.created_at DESC
     LIMIT 30
  `);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">สต็อกสินค้า</h1>
          <p className="text-muted-foreground text-sm">
            {stockRows.length} รายการ · ใกล้หมด {lowCount} · มูลค่าทุนรวม ฿
            {totalValue.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/stock/in">
            <ArrowDownToLine className="mr-2 size-4" /> รับสินค้าเข้า
          </LinkButton>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={Package}
          label="รายการสินค้า"
          value={stockRows.length.toLocaleString('th-TH')}
        />
        <SummaryCard
          icon={AlertTriangle}
          label="ใกล้หมด/หมด"
          value={lowCount.toLocaleString('th-TH')}
          highlight={lowCount > 0}
        />
        <SummaryCard
          icon={Package}
          label="มูลค่าทุนคงเหลือ"
          value={`฿${totalValue.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">สต็อกคงเหลือ</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>ชื่อสินค้า</TableHead>
                  <TableHead className="hidden md:table-cell">หมวดหมู่</TableHead>
                  <TableHead className="text-right">คงเหลือ</TableHead>
                  <TableHead className="text-right">จุดเตือน</TableHead>
                  <TableHead className="text-right">มูลค่าทุน</TableHead>
                  <TableHead className="text-right">ปรับ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                      ยังไม่มีสินค้า
                    </TableCell>
                  </TableRow>
                )}
                {stockRows.map((p) => {
                  const low = p.isActive && p.currentStock <= p.lowStockThreshold;
                  const value = Number(p.costPrice) * Math.max(0, p.currentStock);
                  return (
                    <TableRow key={p.id} className={p.isActive ? '' : 'opacity-60'}>
                      <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                      <TableCell className="font-medium">
                        {p.name}
                        {!p.isActive && (
                          <Badge variant="outline" className="ml-2">
                            ปิดขาย
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">
                        {p.categoryName ?? '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className={low ? 'font-semibold text-amber-600' : ''}>
                          {p.currentStock}
                        </span>
                        {low && <AlertTriangle className="ml-1 inline size-3.5 text-amber-600" />}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right tabular-nums">
                        {p.lowStockThreshold}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        ฿{value.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <AdjustStockButton productId={p.id} productName={p.name} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            <History className="mr-2 inline size-4" /> Movements ล่าสุด (30)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เวลา</TableHead>
                  <TableHead>สินค้า</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>อ้างอิง</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                      ยังไม่มี movement
                    </TableCell>
                  </TableRow>
                )}
                {movements.map((m) => {
                  const sign = m.movementType === 'in' ? '+' : m.movementType === 'out' ? '-' : '';
                  const cls =
                    m.movementType === 'in'
                      ? 'text-emerald-600'
                      : m.movementType === 'out'
                        ? 'text-rose-600'
                        : 'text-muted-foreground';
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(m.createdAt).toLocaleString('th-TH', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                          timeZone: 'Asia/Bangkok',
                        })}
                      </TableCell>
                      <TableCell className="font-medium">{m.productName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{m.movementType}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {m.referenceType ?? '—'}
                      </TableCell>
                      <TableCell className={`text-right tabular-nums font-medium ${cls}`}>
                        {sign}
                        {Math.abs(m.quantity)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-amber-300 dark:border-amber-700' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-muted-foreground text-xs font-medium">{label}</CardTitle>
        <Icon className={highlight ? 'size-4 text-amber-600' : 'text-muted-foreground size-4'} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
