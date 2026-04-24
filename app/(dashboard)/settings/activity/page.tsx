import { ArrowLeft } from 'lucide-react';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { requireAdmin } from '@/lib/utils/auth-admin';

export const dynamic = 'force-dynamic';

const ACTION_VARIANT: Record<string, 'secondary' | 'outline' | 'destructive'> = {
  create: 'secondary',
  update: 'outline',
  delete: 'destructive',
};

export default async function ActivityLogsPage() {
  await requireAdmin();

  const logs = await db.execute<{
    id: string;
    userEmail: string | null;
    userName: string | null;
    action: string;
    entityType: string | null;
    entityId: string | null;
    createdAt: Date;
  }>(sql`
    SELECT
      l.id,
      p.email      AS "userEmail",
      p.full_name  AS "userName",
      l.action,
      l.entity_type AS "entityType",
      l.entity_id   AS "entityId",
      l.created_at  AS "createdAt"
    FROM public.activity_logs l
    LEFT JOIN public.profiles p ON p.id = l.user_id
    ORDER BY l.created_at DESC
    LIMIT 200
  `);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <LinkButton href="/settings" variant="ghost" size="sm">
        <ArrowLeft className="mr-1 size-4" /> กลับ
      </LinkButton>

      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>
            ทุก insert/update/delete บนตารางหลัก (200 รายการล่าสุด) — บันทึกอัตโนมัติด้วย PG trigger
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เวลา</TableHead>
                  <TableHead>ผู้ใช้</TableHead>
                  <TableHead>การกระทำ</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Entity ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                      ยังไม่มี log
                    </TableCell>
                  </TableRow>
                )}
                {logs.map((l) => {
                  const verb = l.action.split('_')[0] ?? l.action;
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleString('th-TH', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                          timeZone: 'Asia/Bangkok',
                        })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {l.userEmail ? (
                          <>
                            <div className="font-medium">{l.userName ?? l.userEmail}</div>
                            <div className="text-muted-foreground text-xs">{l.userEmail}</div>
                          </>
                        ) : (
                          <span className="text-muted-foreground italic">system / cron</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ACTION_VARIANT[verb] ?? 'outline'}>{verb}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{l.entityType ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {l.entityId ? l.entityId.slice(0, 8) + '…' : '—'}
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
