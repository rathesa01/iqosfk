import Link from 'next/link';
import { desc, ilike, or, sql, type SQL } from 'drizzle-orm';
import { Plus, Search } from 'lucide-react';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { LinkButton } from '@/components/ui/link-button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SegmentBadge, StatusBadge } from '@/components/segment-badge';
import { formatBkk } from '@/lib/utils/date';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ q?: string }>;

export default async function CustomersPage({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams;
  const term = q?.trim();

  const where: SQL | undefined = term
    ? or(ilike(customers.name, `%${term}%`), ilike(customers.phone, `%${term}%`))
    : undefined;

  const rows = await db
    .select()
    .from(customers)
    .where(where)
    .orderBy(desc(customers.lastOrderDate), desc(customers.createdAt))
    .limit(200);

  const [{ count = 0 } = { count: 0 }] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(customers);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">ลูกค้า</h1>
          <p className="text-muted-foreground text-sm">ทั้งหมด {count.toLocaleString('th-TH')} ราย</p>
        </div>
        <LinkButton href="/customers/new">
          <Plus className="mr-2 size-4" /> เพิ่มลูกค้า
        </LinkButton>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="sr-only">ค้นหา</CardTitle>
          <CardDescription className="sr-only">ค้นหาลูกค้าด้วยชื่อหรือเบอร์</CardDescription>
          <form className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              name="q"
              defaultValue={term ?? ''}
              placeholder="ค้นหาด้วยชื่อหรือเบอร์โทร…"
              className="pl-9"
            />
          </form>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>เบอร์</TableHead>
                  <TableHead className="hidden md:table-cell">Segment</TableHead>
                  <TableHead className="hidden md:table-cell">สถานะ</TableHead>
                  <TableHead className="hidden md:table-cell text-right">ออเดอร์</TableHead>
                  <TableHead className="hidden md:table-cell text-right">ชิ้นรวม</TableHead>
                  <TableHead className="hidden lg:table-cell">ซื้อล่าสุด</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                      ยังไม่มีข้อมูลลูกค้า
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">
                      <Link href={`/customers/${c.id}`} className="hover:underline">
                        {c.name}
                      </Link>
                      <div className="text-muted-foreground md:hidden mt-0.5 flex items-center gap-1.5">
                        <SegmentBadge segment={c.segment} />
                        <StatusBadge status={c.status} />
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{c.phone}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <SegmentBadge segment={c.segment} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right tabular-nums">
                      {c.totalOrders}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right tabular-nums">
                      {c.totalPieces}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {c.lastOrderDate ? formatBkk(c.lastOrderDate, 'd MMM yyyy') : '—'}
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
