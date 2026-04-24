import Link from 'next/link';
import { asc, desc, eq } from 'drizzle-orm';
import { Plus, AlertTriangle } from 'lucide-react';
import { db } from '@/lib/db';
import { categories, products } from '@/lib/db/schema';
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
import { CategoryQuickAdd } from './category-quick-add';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const cats = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      categoryName: categories.name,
      costPrice: products.costPrice,
      sellPrice: products.sellPrice,
      currentStock: products.currentStock,
      lowStockThreshold: products.lowStockThreshold,
      isActive: products.isActive,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.isActive), asc(products.name));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">สินค้าและหมวดหมู่</h1>
          <p className="text-muted-foreground text-sm">
            สินค้า {rows.length} รายการ · หมวดหมู่ {cats.length} หมวด
          </p>
        </div>
        <LinkButton href="/products/new">
          <Plus className="mr-2 size-4" /> เพิ่มสินค้า
        </LinkButton>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">สินค้าทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>ชื่อสินค้า</TableHead>
                    <TableHead className="hidden md:table-cell">หมวดหมู่</TableHead>
                    <TableHead className="text-right">ทุน</TableHead>
                    <TableHead className="text-right">ราคา</TableHead>
                    <TableHead className="text-right">สต็อก</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                        ยังไม่มีสินค้า
                      </TableCell>
                    </TableRow>
                  )}
                  {rows.map((p) => {
                    const low = p.currentStock <= p.lowStockThreshold;
                    return (
                      <TableRow
                        key={p.id}
                        className={p.isActive ? 'hover:bg-muted/40' : 'opacity-60'}
                      >
                        <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                        <TableCell className="font-medium">
                          <Link href={`/products/${p.id}`} className="hover:underline">
                            {p.name}
                          </Link>
                          {!p.isActive && (
                            <Badge variant="outline" className="ml-2">
                              ปิดขาย
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {p.categoryName ?? '—'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          ฿{Number(p.costPrice).toLocaleString('th-TH')}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          ฿{Number(p.sellPrice).toLocaleString('th-TH')}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <span className={low ? 'text-amber-600' : ''}>{p.currentStock}</span>
                          {low && (
                            <AlertTriangle className="ml-1 inline size-3.5 text-amber-600" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">หมวดหมู่</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CategoryQuickAdd />
            <ul className="text-sm">
              {cats.length === 0 && (
                <li className="text-muted-foreground py-2">ยังไม่มีหมวดหมู่</li>
              )}
              {cats.map((c) => (
                <li key={c.id} className="border-border/60 flex items-center justify-between border-b py-1.5 last:border-0">
                  <span>{c.name}</span>
                  <Badge variant={c.isActive ? 'secondary' : 'outline'}>
                    {c.isActive ? 'ใช้งาน' : 'ปิด'}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
